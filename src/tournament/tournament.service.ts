import {
    File,
    Prisma,
    Role,
    Tournament,
    TournamentRequest,
    TournamentRequestAthlete,
    User
} from '@prisma-client';

import {
    BadRequestException,
    Injectable,
    NotFoundException
} from '@nestjs/common';

import { JwtPayload } from '@auth/interfaces';
import { FileService } from '@file/file.service';
import { PrismaService } from '@prisma/prisma.service';
import { PaginationQueryDto } from '@shared/dto/pagination-query.dto';
import { PaginationDto } from '@shared/dto/pagination.dto';
import { RoleEnum } from '@shared/enums/role.enum';
import { UserService } from '@user/services/user.service';
import { WeightCategoryService } from '@weight-category/weight-category.service';

import { TournamentApplicationRequestDto } from './dto/tournament-application-request.dto';
import { TournamentQueryDto } from './dto/tournament-query.dto';
import { TournamentRequestDto } from './dto/tournament-request.dto';
import { TournamentStatus } from './enums/tournament-status.enum';
import { TournamentApplicationQueryDto } from './dto/tournament-application-query.dto';

@Injectable()
export class TournamentService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly userService: UserService,
        private readonly weightCategoryService: WeightCategoryService,
        private readonly fileService: FileService
    ) {}

    private getTournamentStatus(
        startDate: Date,
        endDate: Date
    ): TournamentStatus {
        const now = new Date();

        if (now < startDate) {
            return TournamentStatus.UPCOMING;
        }

        if (now > endDate) {
            return TournamentStatus.FINISHED;
        }

        return TournamentStatus.ONGOING;
    }

    createDto(tournament: Tournament & { logo?: File; banner?: File }) {
        delete tournament.creatorId;
        delete tournament.logoId;
        delete tournament.bannerId;

        return {
            ...tournament,
            logo: this.fileService.createDto(tournament.logo),
            banner: this.fileService.createDto(tournament.banner),
            status: this.getTournamentStatus(
                tournament.startDate,
                tournament.endDate
            )
        };
    }

    async getById(id: number) {
        const tournament = await this.prismaService.tournament.findUnique({
            where: { id },
            include: {
                logo: true,
                banner: true
            }
        });

        if (!tournament) {
            throw new NotFoundException('Турнир не найден');
        }

        return tournament;
    }

    async getDtoById({
        id,
        requesterUser
    }: {
        id: number;
        requesterUser?: JwtPayload;
    }) {
        const accessWhere = this.getAccessWhere(requesterUser);

        const tournament = await this.prismaService.tournament.findFirst({
            where: { id, ...accessWhere },
            include: {
                logo: true,
                banner: true
            }
        });

        if (!tournament) {
            throw new NotFoundException('Турнир не найден');
        }

        return { tournament: this.createDto(tournament) };
    }

    private validateDates(startDate: Date, endDate: Date) {
        if (endDate < startDate) {
            throw new BadRequestException(
                'Дата окончания не может быть раньше даты начала'
            );
        }
    }

    async create(dto: TournamentRequestDto, creatorId: number) {
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);

        this.validateDates(startDate, endDate);
        await this.validateTournamentFiles(dto);

        const tournament = await this.prismaService.tournament.create({
            data: { ...dto, startDate, endDate, creatorId },
            include: {
                logo: true,
                banner: true
            }
        });

        return { tournament: this.createDto(tournament) };
    }

    private getAccessWhere(user?: JwtPayload): Prisma.TournamentWhereInput {
        if (!user) {
            return {
                isPublished: true
            };
        }

        if (user.roles.includes(RoleEnum.SECRETARY)) {
            return {};
        }

        if (user.roles.includes(RoleEnum.TRAINER)) {
            return {
                OR: [
                    {
                        isPublished: true
                    },
                    {
                        creatorId: user.id
                    }
                ]
            };
        }

        return {
            isPublished: true
        };
    }

    async findAll({
        query,
        requesterUser
    }: {
        query: TournamentQueryDto;
        requesterUser?: JwtPayload;
    }) {
        const { page, limit, isPublished, my } = query;
        const skip = (page - 1) * limit;

        const accessWhere = this.getAccessWhere(requesterUser);

        const filterWhere: Prisma.TournamentWhereInput = {};

        if (isPublished !== undefined) {
            filterWhere.isPublished = isPublished;
        }

        if (my && requesterUser) {
            filterWhere.creatorId = requesterUser.id;
        }

        const where: Prisma.TournamentWhereInput = {
            AND: [accessWhere, filterWhere]
        };

        const [tournaments, total] = await this.prismaService.$transaction([
            this.prismaService.tournament.findMany({
                where,
                include: {
                    logo: true,
                    banner: true
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: limit
            }),
            this.prismaService.tournament.count({
                where
            })
        ]);

        return new PaginationDto(
            tournaments.map(tournament => this.createDto(tournament)),
            total,
            page,
            limit
        );
    }

    private async validateTournamentFiles(dto: TournamentRequestDto) {
        const fileIds = [dto.logoId, dto.bannerId].filter(
            (id): id is number => id !== undefined && id !== null
        );

        if (!fileIds.length) {
            return;
        }

        const filesExist = await this.fileService.exists(fileIds);

        if (!filesExist) {
            throw new NotFoundException('Файл не найден');
        }
    }

    private ensureCanModify(tournament: Tournament, user: JwtPayload) {
        if (user.roles.includes(RoleEnum.SECRETARY)) {
            return;
        }

        if (
            user.roles.includes(RoleEnum.TRAINER) &&
            tournament.creatorId === user.id
        ) {
            return;
        }

        throw new NotFoundException();
    }

    async update(id: number, user: JwtPayload, dto: TournamentRequestDto) {
        const existingTournament = await this.getById(id);
        this.ensureCanModify(existingTournament, user);

        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);

        this.validateDates(startDate, endDate);
        await this.validateTournamentFiles(dto);

        await this.prismaService.$transaction(async tx => {
            await tx.tournament.update({
                where: { id },
                data: { ...dto, startDate, endDate }
            });

            if (
                existingTournament.logoId &&
                existingTournament.logoId != dto.logoId &&
                existingTournament.logoId != dto.bannerId
            ) {
                await this.fileService.delete(existingTournament.logoId, tx);
            }

            if (
                existingTournament.bannerId &&
                existingTournament.bannerId != dto.bannerId &&
                existingTournament.bannerId != dto.logoId
            ) {
                await this.fileService.delete(existingTournament.bannerId, tx);
            }
        });

        return this.getDtoById({ id, requesterUser: user });
    }

    async remove(id: number, user: JwtPayload) {
        const existingTournament = await this.getById(id);
        this.ensureCanModify(existingTournament, user);

        await this.prismaService.$transaction(async tx => {
            await tx.tournament.delete({ where: { id } });

            for (const fileId of [
                existingTournament.logoId,
                existingTournament.bannerId
            ]) {
                if (fileId) await this.fileService.delete(fileId, tx);
            }
        });

        return { tournament: this.createDto(existingTournament) };
    }

    async getRequestById(requestId: number, requesterUser?: JwtPayload) {
        const tournamentRequest =
            await this.prismaService.tournamentRequest.findFirst({
                include: {
                    trainer: { include: { avatar: true, roles: true } },
                    _count: {
                        select: {
                            athletes: true
                        }
                    }
                },
                where: {
                    id: requestId,
                    ...this.getRequestAccessWhere(requesterUser)
                }
            });

        if (!tournamentRequest) {
            throw new NotFoundException('Заявка на турнир не найдена');
        }

        return tournamentRequest;
    }

    createRequestDto(
        request: TournamentRequest & {
            _count: { athletes: number };
            trainer: User & { roles: Role[] };
        }
    ) {
        return {
            id: request.id,
            organization: request.organization,
            isAccepted: request.isAccepted,
            trainer: this.userService.createDto(request.trainer),
            athletesCount: request._count.athletes,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt
        };
    }

    async getRequestDtoById({
        id,
        requesterUser
    }: {
        id: number;
        requesterUser: JwtPayload;
    }) {
        const request = await this.prismaService.tournamentRequest.findFirst({
            where: { id, ...this.getRequestAccessWhere(requesterUser) },
            include: {
                trainer: { include: { avatar: true, roles: true } },
                _count: { select: { athletes: true } }
            }
        });

        if (!request) {
            throw new NotFoundException('Заявка на турнир не найдена');
        }

        return { tournamentRequest: this.createRequestDto(request) };
    }

    private createAthleteDto(
        athlete: TournamentRequestAthlete & {
            athlete: User & { roles: Role[]; avatar: File };
            weightCategory: any;
        }
    ) {
        return {
            id: athlete.id,
            athlete: this.userService.createDto(athlete.athlete),
            weightCategory: athlete.weightCategory
        };
    }

    private async validateRequestData(
        tournamentId: number,
        dto: TournamentApplicationRequestDto,
        trainerId: number,
        excludedRequestId?: number
    ) {
        const { maxParticipants, acceptedAthletesCount, startDate, endDate } =
            await this.getById(tournamentId);

        if (
            this.getTournamentStatus(startDate, endDate) !=
            TournamentStatus.UPCOMING
        ) {
            throw new BadRequestException(
                'В текущий момент не ведется набор на данный турнир'
            );
        }

        const athleteIds = dto.athletes.map(a => a.athleteId);

        await this.userService.validateAndGetInvitedUserIds(
            trainerId,
            athleteIds
        );

        await this.weightCategoryService.validateWeightCategoryIds([
            ...new Set(dto.athletes.map(a => a.weightCategoryId))
        ]);

        const requestsCount = await this.prismaService.tournamentRequest.count({
            where: {
                tournamentId,
                trainerId,
                id: { not: excludedRequestId }
            }
        });

        if (requestsCount > 0) {
            throw new BadRequestException('Заявка на данный турнир уже подана');
        }

        if (
            maxParticipants &&
            maxParticipants - acceptedAthletesCount - athleteIds.length < 0
        ) {
            throw new BadRequestException(
                'Недостаточно свободных мест для регистрации'
            );
        }
    }

    async createRequest(
        tournamentId: number,
        dto: TournamentApplicationRequestDto,
        trainer: JwtPayload
    ) {
        await this.validateRequestData(tournamentId, dto, trainer.id);

        const createdRequest =
            await this.prismaService.tournamentRequest.create({
                data: {
                    tournamentId,
                    organization: dto.organization,
                    trainerId: trainer.id,
                    athletes: {
                        create: dto.athletes.map(
                            ({ athleteId, weightCategoryId }) => ({
                                athleteId,
                                weightCategoryId
                            })
                        )
                    }
                }
            });

        return this.getRequestDtoById({
            id: createdRequest.id,
            requesterUser: trainer
        });
    }

    private getRequestAccessWhere(
        user?: JwtPayload
    ): Prisma.TournamentRequestWhereInput {
        if (!user) {
            return { isAccepted: true };
        }

        if (user.roles.includes(RoleEnum.SECRETARY)) {
            return {};
        }

        if (user.roles.includes(RoleEnum.TRAINER)) {
            return { trainerId: user.id };
        }

        return { isAccepted: true };
    }

    async findAllRequests(
        query: TournamentApplicationQueryDto,
        requesterUser?: JwtPayload
    ) {
        const { page, limit, tournamentId } = query;

        const accessWhere = this.getRequestAccessWhere(requesterUser);
        const filterWhere: Prisma.TournamentRequestWhereInput = {};

        if (tournamentId != undefined) {
            filterWhere.tournamentId = tournamentId;
        }

        const where = {
            ...accessWhere,
            ...filterWhere
        };

        console.log({ where });

        const skip = (page - 1) * limit;

        const [requests, total] = await this.prismaService.$transaction([
            this.prismaService.tournamentRequest.findMany({
                where,
                include: {
                    trainer: { include: { avatar: true, roles: true } },
                    _count: { select: { athletes: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            this.prismaService.tournamentRequest.count({
                where
            })
        ]);

        const dtos = requests.map(r => this.createRequestDto(r));

        return new PaginationDto(dtos, total, page, limit);
    }

    async findRequestAthletes(
        requestId: number,
        query: PaginationQueryDto,
        requesterUser?: JwtPayload
    ) {
        await this.getRequestById(requestId, requesterUser);

        const { page, limit } = query;
        const where = { requestId };
        const skip = (page - 1) * limit;
        const [athletes, total] = await this.prismaService.$transaction([
            this.prismaService.tournamentRequestAthlete.findMany({
                where,
                include: {
                    athlete: {
                        include: {
                            roles: true,
                            avatar: true,
                            belt: true,
                            sportRank: true
                        }
                    },
                    weightCategory: true
                },
                orderBy: { id: 'asc' },
                skip,
                take: limit
            }),
            this.prismaService.tournamentRequestAthlete.count({ where })
        ]);

        return new PaginationDto(
            athletes.map(athlete => this.createAthleteDto(athlete)),
            total,
            page,
            limit
        );
    }

    async updateRequest(
        id: number,
        user: JwtPayload,
        dto: TournamentApplicationRequestDto
    ) {
        const request = await this.getRequestById(id, user);

        if (request.isAccepted) {
            throw new BadRequestException('Заявка уже принята');
        }

        await this.validateRequestData(request.tournamentId, dto, user.id, id);

        await this.prismaService.tournamentRequest.update({
            where: { id },
            data: {
                organization: dto.organization,
                athletes: {
                    deleteMany: {},
                    create: dto.athletes.map(
                        ({ athleteId, weightCategoryId }) => ({
                            athleteId,
                            weightCategoryId
                        })
                    )
                }
            }
        });

        return this.getRequestDtoById({ id, requesterUser: user });
    }

    async removeRequest(id: number, user: JwtPayload) {
        const request = await this.getRequestById(id, user);
        const dto = this.createRequestDto(request);

        if (request.isAccepted) {
            throw new BadRequestException('Заявка уже принята');
        }

        await this.prismaService.tournamentRequest.delete({
            where: { id }
        });

        return { tournamentRequest: dto };
    }

    async acceptRequest(id: number, secretary: JwtPayload) {
        await this.prismaService.$transaction(async tx => {
            const request = await tx.tournamentRequest.findFirst({
                where: { id },
                include: {
                    tournament: true,
                    _count: { select: { athletes: true } }
                }
            });

            if (!request) {
                throw new NotFoundException('Заявка на турнир не найдена');
            }

            if (request.isAccepted) {
                throw new BadRequestException('Заявка уже принята');
            }

            if (
                request.tournament.maxParticipants &&
                request.tournament.maxParticipants -
                    request.tournament.acceptedAthletesCount -
                    request._count.athletes <
                    0
            ) {
                throw new BadRequestException(
                    'Недостаточно свободных мест для регистрации'
                );
            }

            await tx.tournamentRequest.update({
                where: { id },
                data: {
                    isAccepted: true
                }
            });

            await tx.tournament.update({
                where: {
                    id: request.tournamentId
                },
                data: {
                    acceptedAthletesCount: {
                        increment: request._count.athletes
                    }
                }
            });
        });

        return this.getRequestDtoById({
            id,
            requesterUser: secretary
        });
    }

    async rejectRequest(id: number, secretary: JwtPayload) {
        await this.prismaService.$transaction(async tx => {
            const request = await tx.tournamentRequest.findFirst({
                where: { id },
                include: {
                    tournament: true,
                    _count: { select: { athletes: true } }
                }
            });

            if (!request) {
                throw new NotFoundException('Заявка на турнир не найдена');
            }

            if (!request.isAccepted) {
                throw new BadRequestException('Заявка еще не принята');
            }

            await tx.tournamentRequest.update({
                where: { id },
                data: {
                    isAccepted: false
                }
            });

            await tx.tournament.update({
                where: {
                    id: request.tournamentId
                },
                data: {
                    acceptedAthletesCount: {
                        decrement: request._count.athletes
                    }
                }
            });
        });

        return this.getRequestDtoById({
            id,
            requesterUser: secretary
        });
    }
}
