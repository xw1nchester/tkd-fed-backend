import {
    Belt,
    BeltAttestationAthlete,
    BeltAttestationRequest,
    File,
    Prisma,
    Role,
    User
} from '@prisma-client';

import {
    BadRequestException,
    Injectable,
    NotFoundException
} from '@nestjs/common';

import { JwtPayload } from '@auth/interfaces';
import { BeltService } from '@belt/belt.service';
import { PrismaService } from '@prisma/prisma.service';
import { PaginationQueryDto } from '@shared/dto/pagination-query.dto';
import { PaginationDto } from '@shared/dto/pagination.dto';
import { RoleEnum } from '@shared/enums/role.enum';
import { UserService } from '@user/services/user.service';

import { BeltAttestationRequestDto } from './dto/belt-attestation-request.dto';

@Injectable()
export class BeltAttestationService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly userService: UserService,
        private readonly beltService: BeltService
    ) {}

    createDto(
        beltAttestationRequest: BeltAttestationRequest & {
            trainer: User & { roles: Role[] };
        }
    ) {
        return {
            id: beltAttestationRequest.id,
            attestationDate: beltAttestationRequest.attestationDate,
            trainer: this.userService.createDto(beltAttestationRequest.trainer),
            isAccepted: beltAttestationRequest.isAccepted,
            createdAt: beltAttestationRequest.createdAt,
            updatedAt: beltAttestationRequest.updatedAt
        };
    }

    async getById(id: number) {
        const request =
            await this.prismaService.beltAttestationRequest.findFirst({
                where: { id },
                include: { trainer: { include: { roles: true } } }
            });

        if (!request) {
            throw new NotFoundException('Заявка на аттестацию не найдена');
        }

        return request;
    }

    private getAccessWhere(
        user: JwtPayload
    ): Prisma.BeltAttestationRequestWhereInput {
        if (user.roles.includes(RoleEnum.CHAIRMAN)) {
            return {};
        }

        return { trainerId: user.id };
    }

    private ensureCanModify(request: BeltAttestationRequest, user: JwtPayload) {
        if (user.roles.includes(RoleEnum.CHAIRMAN)) {
            return;
        }

        if (
            user.roles.includes(RoleEnum.TRAINER) &&
            request.trainerId === user.id
        ) {
            return;
        }

        throw new NotFoundException();
    }

    async getDtoById({
        id,
        requesterUser
    }: {
        id: number;
        requesterUser: JwtPayload;
    }) {
        const request =
            await this.prismaService.beltAttestationRequest.findFirst({
                where: { id, ...this.getAccessWhere(requesterUser) },
                include: { trainer: { include: { avatar: true, roles: true } } }
            });

        if (!request) {
            throw new NotFoundException('Заявка на аттестацию не найдена');
        }

        return { beltAttestationRequest: this.createDto(request) };
    }

    private async prepareRequestData(
        dto: BeltAttestationRequestDto,
        trainerId: number
    ) {
        const { belts } = await this.beltService.findAll();
        const invitedUsers =
            await this.userService.validateAndGetInvitedUserIds(
                trainerId,
                dto.athletes.map(athlete => athlete.athleteId)
            );

        const athleteBeltMap = new Map<number, number | null>();

        for (const { athleteId, requestedBeltId } of dto.athletes) {
            const belt = belts.find(item => item.id === requestedBeltId);

            if (!belt) {
                throw new NotFoundException('Пояс не найден');
            }

            const athlete = invitedUsers.find(user => user.id === athleteId);

            if (athlete.belt && athlete.belt.sortOrder >= belt.sortOrder) {
                throw new NotFoundException(
                    'Новый пояс должен быть выше текущего'
                );
            }

            athleteBeltMap.set(athlete.id, athlete.beltId);
        }

        return athleteBeltMap;
    }

    async createRequest(dto: BeltAttestationRequestDto, trainerId: number) {
        const athleteBeltMap = await this.prepareRequestData(dto, trainerId);

        const request = await this.prismaService.beltAttestationRequest.create({
            data: {
                attestationDate: new Date(dto.attestationDate),
                trainerId,
                athletes: {
                    create: dto.athletes.map(
                        ({ athleteId, requestedBeltId }) => ({
                            athleteId,
                            currentBeltId: athleteBeltMap.get(athleteId),
                            requestedBeltId
                        })
                    )
                }
            }
        });

        return {
            beltAttestationRequest: this.createDto(
                await this.getById(request.id)
            )
        };
    }

    async findAll(query: PaginationQueryDto, requesterUser: JwtPayload) {
        const { page, limit } = query;
        const where = this.getAccessWhere(requesterUser);
        const skip = (page - 1) * limit;
        const [requests, total] = await this.prismaService.$transaction([
            this.prismaService.beltAttestationRequest.findMany({
                where,
                include: {
                    trainer: { include: { avatar: true, roles: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            this.prismaService.beltAttestationRequest.count({ where })
        ]);

        return new PaginationDto(
            requests.map(request => this.createDto(request)),
            total,
            page,
            limit
        );
    }

    private createAthleteDto(
        athlete: BeltAttestationAthlete & {
            athlete: User & { roles: Role[]; avatar: File };
            currentBelt: Belt;
            requestedBelt: Belt;
        }
    ) {
        return {
            id: athlete.id,
            athlete: this.userService.createDto(athlete.athlete),
            currentBelt: athlete.currentBelt,
            requestedBelt: athlete.requestedBelt
        };
    }

    async findAthletes(
        requestId: number,
        query: PaginationQueryDto,
        requesterUser: JwtPayload
    ) {
        const request = await this.getById(requestId);
        this.ensureCanModify(request, requesterUser);

        const { page, limit } = query;
        const where = { requestId };
        const skip = (page - 1) * limit;
        const [athletes, total] = await this.prismaService.$transaction([
            this.prismaService.beltAttestationAthlete.findMany({
                where,
                include: {
                    athlete: { include: { roles: true, avatar: true } },
                    currentBelt: true,
                    requestedBelt: true
                },
                orderBy: { id: 'asc' },
                skip,
                take: limit
            }),
            this.prismaService.beltAttestationAthlete.count({ where })
        ]);

        return new PaginationDto(
            athletes.map(athlete => this.createAthleteDto(athlete)),
            total,
            page,
            limit
        );
    }

    async accept(id: number, chairman: JwtPayload) {
        await this.prismaService.$transaction(async tx => {
            const request = await tx.beltAttestationRequest.findFirst({
                where: { id },
                include: { athletes: true }
            });

            if (!request) {
                throw new NotFoundException('Заявка на аттестацию не найдена');
            }

            if (request.isAccepted) {
                throw new BadRequestException('Заявка уже принята');
            }

            await tx.beltAttestationRequest.update({
                where: { id },
                data: {
                    isAccepted: true,
                    chairmanId: chairman.id
                }
            });

            await Promise.all(
                request.athletes.map(athlete =>
                    tx.user.update({
                        where: { id: athlete.athleteId },
                        data: {
                            beltId: athlete.requestedBeltId
                        }
                    })
                )
            );
        });

        return this.getDtoById({
            id,
            requesterUser: chairman
        });
    }

    async update(id: number, user: JwtPayload, dto: BeltAttestationRequestDto) {
        const request = await this.getById(id);
        this.ensureCanModify(request, user);

        if (request.isAccepted) {
            throw new BadRequestException('Заявка уже принята');
        }

        const athleteBeltMap = await this.prepareRequestData(
            dto,
            request.trainerId
        );

        await this.prismaService.beltAttestationRequest.update({
            where: { id },
            data: {
                attestationDate: new Date(dto.attestationDate),
                athletes: {
                    deleteMany: {},
                    create: dto.athletes.map(
                        ({ athleteId, requestedBeltId }) => ({
                            athleteId,
                            currentBeltId: athleteBeltMap.get(athleteId),
                            requestedBeltId
                        })
                    )
                }
            }
        });

        return this.getDtoById({ id, requesterUser: user });
    }

    async remove(id: number, user: JwtPayload) {
        const request = await this.getById(id);
        this.ensureCanModify(request, user);
        const dto = { beltAttestationRequest: this.createDto(request) };

        await this.prismaService.beltAttestationRequest.delete({
            where: { id }
        });

        return dto;
    }
}
