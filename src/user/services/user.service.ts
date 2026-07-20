import { genSaltSync, hashSync } from 'bcrypt';

import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException
} from '@nestjs/common';

import { PrismaService } from '@prisma/prisma.service';
import {
    Belt,
    Document,
    DocumentVerification,
    File,
    Prisma,
    Role,
    SportRank,
    Team,
    User,
    VerificationStatus
} from '@prisma-client';
import { ConfigService } from '@nestjs/config';
import { BasicUserEditRequestDto } from '../dto/basic-user-edit-request.dto';
import { PaginationDto } from '@shared/dto/pagination.dto';
import { UserEditRequestDto } from '@admin/user/dto/user-edit-request.dto';
import { RoleEnum } from '@shared/enums/role.enum';
import { RegisterRequestDto } from '@auth/dto/register-request.dto';
import { AdminUserQueryDto } from '@admin/user/dto/admin-user-query.dto';
import { DetailedUserInfoRequestDto } from '../dto/detailed-user-info-request.dto';
import { FileService } from '@file/file.service';
import { BeltService } from '@belt/belt.service';
import { SportRankService } from '@sport-rank/sport-rank.service';
import { AdminDetailedUserInfoRequestDto } from '@admin/user/dto/admin-detailed-user-info-request.dto';
import { OrderOption, SortOption } from '@user/dto/user-query.dto';

@Injectable()
export class UserService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly configService: ConfigService,
        private readonly fileService: FileService,
        private readonly beltService: BeltService,
        private readonly sportRankService: SportRankService
    ) {}

    async getById(id: number) {
        const user = await this.prismaService.user.findFirst({
            where: { id },
            include: { avatar: true, roles: true }
        });

        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }

        return user;
    }

    async getByEmail(email: string) {
        return await this.prismaService.user.findFirst({
            where: { email },
            include: { roles: true }
        });
    }

    // TODO: создать отдельное dto
    async create(
        {
            email,
            firstName,
            lastName,
            middleName,
            birthDate,
            gender,
            password
        }: RegisterRequestDto,
        inviterId: number
    ) {
        const createdUser = await this.prismaService.user.create({
            data: {
                email,
                firstName,
                lastName,
                middleName,
                birthDate: new Date(birthDate),
                gender,
                password: hashSync(password, genSaltSync(10)),
                invitedById: inviterId
            }
        });

        return await this.getById(createdUser.id);
    }

    async updatePassword(id: number, newPassword: string) {
        return await this.prismaService.user.update({
            where: { id },
            data: {
                password: hashSync(newPassword, genSaltSync(10))
            }
        });
    }

    async verify(id: number) {
        return await this.prismaService.user.update({
            where: {
                id
            },
            data: { isVerified: true }
        });
    }

    createDto(
        user: User & { avatar?: File; roles: Role[]; teams?: Partial<Team>[] }
    ) {
        return {
            id: user.id,
            email: user.email,
            avatar: this.fileService.createDto(user.avatar),
            firstName: user.firstName,
            lastName: user.lastName,
            middleName: user.middleName,
            birthDate: user.birthDate,
            gender: user.gender,
            isVerified: user.isVerified,
            rating: user.rating,
            roles: user.roles,
            teams: user.teams
        };
    }

    async getDtoById(id: number) {
        const user = await this.getById(id);
        return { user: this.createDto(user) };
    }

    async updateAvatar(id: number, fileId: number) {
        await this.getById(id);

        const fileExists = await this.fileService.exists([fileId]);

        if (!fileExists) {
            throw new NotFoundException('Файл не найден');
        }

        await this.prismaService.user.update({
            where: { id },
            data: { avatarId: fileId }
        });

        return await this.getDtoById(id);
    }

    async deleteAvatar(id: number) {
        await this.getById(id);

        await this.prismaService.user.update({
            where: { id },
            data: { avatarId: null }
        });

        // TODO: удалить файл

        return await this.getDtoById(id);
    }

    async updateBasicUserInfo(id: number, dto: BasicUserEditRequestDto) {
        await this.getById(id);

        await this.prismaService.user.update({
            where: { id },
            data: {
                firstName: dto.firstName,
                lastName: dto.lastName,
                middleName: dto.middleName,
                birthDate: new Date(dto.birthDate),
                gender: dto.gender
            }
        });

        return await this.getDtoById(id);
    }

    async updateUserInfo(id: number, dto: UserEditRequestDto) {
        await this.getById(id);

        const roles = await this.prismaService.role.findMany({
            where: {
                id: { in: dto.roleIds }
            },
            select: { id: true }
        });

        const foundIds = roles.map(r => r.id);

        if (foundIds.length !== dto.roleIds.length) {
            throw new NotFoundException('Роль не найдена');
        }

        await this.prismaService.user.update({
            where: { id },
            data: {
                email: dto.email,
                isVerified: dto.isVerified,
                firstName: dto.firstName,
                lastName: dto.lastName,
                middleName: dto.middleName,
                birthDate: new Date(dto.birthDate),
                gender: dto.gender,
                roles: {
                    set: dto.roleIds.map(id => ({ id }))
                }
            }
        });

        return await this.getDtoById(id);
    }

    async removeUser(id: number, adminId: number) {
        const dto = await this.getDtoById(id);

        if (
            id == adminId ||
            dto.user.roles.some(r => r.name == RoleEnum.ADMIN)
        ) {
            throw new BadRequestException(
                'Нельзя выполнить это действие для данного пользователя'
            );
        }

        await this.prismaService.user.delete({ where: { id } });

        return dto;
    }

    async findAll({
        query,
        excludeAdmins = true,
        invitedById,
        includeTeams = false
    }: {
        query: Partial<AdminUserQueryDto>;
        excludeAdmins?: boolean;
        invitedById?: number;
        includeTeams?: boolean;
    }) {
        let {
            page,
            limit,
            search,
            sortBy,
            order,
            teamId,
            roleId,
            excludedTeamId
        } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.UserWhereInput = {
            ...(excludeAdmins && {
                roles: {
                    none: {
                        name: RoleEnum.ADMIN
                    }
                }
            }),
            ...(!!search && {
                OR: [
                    {
                        firstName: {
                            contains: search,
                            mode: 'insensitive'
                        }
                    },
                    {
                        lastName: {
                            contains: search,
                            mode: 'insensitive'
                        }
                    },
                    {
                        middleName: {
                            contains: search,
                            mode: 'insensitive'
                        }
                    }
                ]
            }),
            ...(invitedById && {
                invitedById
            }),
            ...(teamId && {
                teams: {
                    some: {
                        id: teamId
                    }
                }
            }),
            ...(roleId && {
                roles: {
                    some: {
                        id: roleId
                    }
                }
            }),
            ...(excludedTeamId && {
                teams: {
                    none: {
                        id: excludedTeamId
                    }
                }
            })
        };

        sortBy = sortBy ?? SortOption.CREATED_AT;
        order = order ?? OrderOption.DESC;

        const data = await this.prismaService.user.findMany({
            where,
            include: {
                avatar: true,
                roles: true,
                ...(includeTeams && {
                    teams: { select: { id: true, name: true } }
                })
            },
            orderBy: {
                [sortBy]: order
            },
            take: limit,
            skip
        });

        const totalCount = await this.prismaService.user.count({
            where
        });

        const dtos = data.map(u => this.createDto(u));

        return new PaginationDto(dtos, totalCount, page, limit);
    }

    async validateInvitedUserIds(invitedById: number, userIds: number[]) {
        const users = await this.prismaService.user.findMany({
            where: { invitedById, id: { in: userIds } }
        });

        if (userIds.length != users.length) {
            throw new NotFoundException('Пользователь не найден');
        }
    }

    createUserDetailedDto({
        belt,
        sportRank,
        documents,
        documentVerification
    }: {
        belt: Belt;
        sportRank: SportRank;
        documents: (Document & { file: File })[];
        documentVerification: DocumentVerification;
    }) {
        return {
            belt,
            sportRank,
            documents: documents.map(({ id, type, createdAt, file }) => ({
                id,
                type,
                createdAt,
                file: this.fileService.createDto(file)
            })),
            documentVerification: documentVerification
                ? {
                      id: documentVerification.id,
                      status:
                          documentVerification.status ==
                              VerificationStatus.APPROVED &&
                          documentVerification.reverificationAt &&
                          new Date(documentVerification.reverificationAt) <
                              new Date()
                              ? VerificationStatus.PENDING
                              : documentVerification.status,
                      comment: documentVerification.comment,
                      createdAt: documentVerification.createdAt,
                      updatedAt: documentVerification.updatedAt,
                      reverificationAt: documentVerification.reverificationAt
                  }
                : null
        };
    }

    async getDetailedUserInfoDto(id: number) {
        const data = await this.prismaService.user.findFirst({
            where: { id },
            include: {
                belt: true,
                sportRank: true,
                documents: {
                    include: {
                        file: true
                    }
                },
                documentVerification: true
            }
        });

        return { user: this.createUserDetailedDto(data) };
    }

    async getDetailedUserInfoByTrainer(userId: number, trainerId: number) {
        // TODO: предусмотреть чтобы редактировать пользователя мог любой его родитель
        const { invitedById } = await this.getById(userId);

        if (trainerId != invitedById) {
            throw new ForbiddenException();
        }

        return await this.getDetailedUserInfoDto(userId);
    }

    async updateDetailedUserInfo(
        id: number,
        {
            beltId,
            sportRankId,
            documents,
            status,
            comment,
            reverificationAt
        }: Partial<AdminDetailedUserInfoRequestDto>
    ) {
        const beltExists = await this.beltService.exists(beltId);

        if (!beltExists) {
            throw new NotFoundException('Пояс не найден');
        }

        const sportRankExists = await this.sportRankService.exists(sportRankId);

        if (!sportRankExists) {
            throw new NotFoundException('Разряд не найден');
        }

        const filesExists = await this.fileService.exists(
            documents.map(d => d.fileId)
        );

        if (!filesExists) {
            throw new NotFoundException('Файл не найден');
        }

        await this.prismaService.user.update({
            where: { id },
            data: {
                beltId,
                sportRankId,
                documents: {
                    deleteMany: {},
                    create: documents.map(({ type, fileId }) => ({
                        type,
                        fileId
                    }))
                },
                documentVerification: {
                    upsert: {
                        create: {
                            status: VerificationStatus.PENDING
                        },
                        update: {
                            status: status ?? VerificationStatus.PENDING,
                            // TODO: оставлять старый коммент
                            comment,
                            reverificationAt: reverificationAt
                                ? new Date(reverificationAt)
                                : null
                        }
                    }
                }
            }
        });

        return await this.getDetailedUserInfoDto(id);
    }

    async updateDetailedUserInfoByTrainer(
        userId: number,
        trainerId: number,
        dto: DetailedUserInfoRequestDto
    ) {
        const { invitedById } = await this.getById(userId);

        if (trainerId != invitedById) {
            throw new ForbiddenException();
        }

        return await this.updateDetailedUserInfo(userId, dto);
    }
}
