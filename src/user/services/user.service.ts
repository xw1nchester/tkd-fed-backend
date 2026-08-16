import {
    Belt,
    Document,
    DocumentTemplate,
    DocumentVerification,
    File,
    Prisma,
    Role,
    SportRank,
    Team,
    User,
    VerificationStatus
} from '@prisma-client';
import { genSaltSync, hashSync } from 'bcrypt';

import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AdminDetailedUserInfoRequestDto } from '@admin/user/dto/admin-detailed-user-info-request.dto';
import { AdminUserQueryDto } from '@admin/user/dto/admin-user-query.dto';
import { UserEditRequestDto } from '@admin/user/dto/user-edit-request.dto';
import { RegisterRequestDto } from '@auth/dto/register-request.dto';
import { JwtPayload } from '@auth/interfaces';
import { BeltService } from '@belt/belt.service';
import { FileService } from '@file/file.service';
import { PrismaService } from '@prisma/prisma.service';
import { PaginationDto } from '@shared/dto/pagination.dto';
import { RoleEnum } from '@shared/enums/role.enum';
import { SportRankService } from '@sport-rank/sport-rank.service';
import { OrderOption, SortOption } from '@user/dto/user-query.dto';

import { BasicUserEditRequestDto } from '../dto/basic-user-edit-request.dto';
import { DetailedUserInfoRequestDto } from '../dto/detailed-user-info-request.dto';

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
            include: { avatar: true, roles: true, belt: true }
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
        user: User & {
            avatar?: File;
            roles: Role[];
            teams?: Partial<Team>[];
            belt?: Belt;
            sportRank?: SportRank;
        }
    ) {
        return {
            id: user.id,
            email: user.email,
            avatar: this.fileService.createPublicDto(user.avatar),
            firstName: user.firstName,
            lastName: user.lastName,
            middleName: user.middleName,
            birthDate: user.birthDate,
            gender: user.gender,
            firstTrainer: user.firstTrainer,
            isVerified: user.isVerified,
            rating: user.rating,
            roles: user.roles,
            teams: user.teams,
            belt: user.belt,
            sportRank: user.sportRank
        };
    }

    async getDtoById(id: number) {
        const user = await this.getById(id);
        return { user: this.createDto(user) };
    }

    async createDocumentTemplateDto(
        documentTemplate: DocumentTemplate & { file: File }
    ) {
        return {
            id: documentTemplate.id,
            createdAt: documentTemplate.createdAt,
            file: await this.fileService.createPrivateDto(documentTemplate.file)
        };
    }

    async createDocumentTemplate(userId: number, fileId: number) {
        const fileExists = await this.fileService.exists(fileId, userId);

        if (!fileExists) {
            throw new NotFoundException('Файл не найден');
        }

        const documentTemplate =
            await this.prismaService.documentTemplate.create({
                data: {
                    userId,
                    fileId
                },
                include: {
                    file: true
                }
            });

        return {
            documentTemplate:
                await this.createDocumentTemplateDto(documentTemplate)
        };
    }

    async getDocumentTemplates(userId: number) {
        const documentTemplates =
            await this.prismaService.documentTemplate.findMany({
                where: { userId },
                include: {
                    file: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

        return {
            documentTemplates: await Promise.all(
                documentTemplates.map(documentTemplate =>
                    this.createDocumentTemplateDto(documentTemplate)
                )
            )
        };
    }

    async deleteDocumentTemplate(userId: number, id: number) {
        const documentTemplate =
            await this.prismaService.documentTemplate.findFirst({
                where: {
                    id,
                    userId
                },
                include: {
                    file: true
                }
            });

        if (!documentTemplate) {
            throw new NotFoundException('Document template not found');
        }

        const dto = await this.createDocumentTemplateDto(documentTemplate);

        await this.fileService.delete(documentTemplate.fileId);

        return { documentTemplate: dto };
    }

    async updateAvatar(id: number, fileId: number) {
        const user = await this.getById(id);

        // TODO: если загружает обычный пользователь, то необходимо проверить, что файл его
        const fileExists = await this.fileService.exists(fileId);

        if (!fileExists) {
            throw new NotFoundException('Файл не найден');
        }

        await this.prismaService.$transaction(async tx => {
            await tx.user.update({
                where: { id },
                data: { avatarId: fileId }
            });

            if (user.avatarId && user.avatarId != fileId) {
                await this.fileService.delete(user.avatarId, tx);
            }
        });

        return await this.getDtoById(id);
    }

    async deleteAvatar(id: number) {
        const user = await this.getById(id);

        await this.prismaService.$transaction(async tx => {
            await tx.user.update({
                where: { id },
                data: { avatarId: null }
            });

            if (user.avatarId) {
                await this.fileService.delete(user.avatarId, tx);
            }
        });

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
                gender: dto.gender,
                firstTrainer: dto.firstTrainer
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
                firstTrainer: dto.firstTrainer,
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

        await this.prismaService.$transaction(async tx => {
            const files = await tx.file.findMany({
                where: { userId: id },
                select: { storageKey: true }
            });

            if (files.length) {
                await tx.pendingFileDeletion.createMany({
                    data: files.map(file => ({
                        storageKey: file.storageKey
                    }))
                });
            }

            await tx.user.delete({
                where: { id }
            });
        });

        return dto;
    }

    private getBirthDateFilter(minAge?: number, maxAge?: number) {
        if (minAge == undefined && maxAge == undefined) return {};

        const today = new Date();

        const birthDateFilter: Prisma.DateTimeFilter = {};

        // минимум возраста -> пользователь должен быть не младше
        if (minAge !== undefined) {
            const date = new Date(today);
            date.setFullYear(today.getFullYear() - minAge);

            birthDateFilter.lte = date;
        }

        // максимум возраста -> пользователь должен быть не старше
        if (maxAge !== undefined) {
            const date = new Date(today);
            date.setFullYear(today.getFullYear() - maxAge - 1);
            date.setDate(date.getDate() + 1);

            birthDateFilter.gte = date;
        }

        return birthDateFilter;
    }

    async findAll({
        query,
        excludeAdmins = true,
        invitedById,
        includeTeams = false,
        includeBelt = false
    }: {
        query: Partial<AdminUserQueryDto>;
        excludeAdmins?: boolean;
        invitedById?: number;
        includeTeams?: boolean;
        includeBelt?: boolean;
    }) {
        const {
            page,
            limit,
            search,
            teamId,
            roleId,
            excludedTeamId,
            isTrainer,
            minAge,
            maxAge
        } = query;
        let { sortBy, order } = query;
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
            ...(excludedTeamId && {
                teams: {
                    none: {
                        id: excludedTeamId
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
            ...(isTrainer && {
                roles: {
                    some: {
                        name: RoleEnum.TRAINER
                    }
                }
            }),
            birthDate: this.getBirthDateFilter(minAge, maxAge)
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
                }),
                ...(includeBelt && {
                    belt: true
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

    async validateAndGetInvitedUserIds(invitedById: number, userIds: number[]) {
        const users = await this.prismaService.user.findMany({
            where: { invitedById, id: { in: userIds } },
            include: { belt: true }
        });

        if (userIds.length != users.length) {
            throw new NotFoundException('Пользователь не найден');
        }

        return users;
    }

    async createUserDetailedDto({
        sportRank,
        documents,
        documentVerification
    }: {
        sportRank: SportRank;
        documents: (Document & { file: File })[];
        documentVerification: DocumentVerification;
    }) {
        return {
            sportRank,
            documents: await Promise.all(
                documents.map(async ({ id, type, createdAt, file }) => ({
                    id,
                    type,
                    createdAt,
                    file: await this.fileService.createPrivateDto(file)
                }))
            ),
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
                sportRank: true,
                documents: {
                    include: {
                        file: true
                    }
                },
                documentVerification: true
            }
        });

        return { user: await this.createUserDetailedDto(data) };
    }

    async getDetailedUserInfoByTrainer(userId: number, actor: JwtPayload) {
        // TODO: предусмотреть чтобы редактировать пользователя мог любой его родитель
        const { invitedById } = await this.getById(userId);

        if (actor.id != invitedById && !actor.roles.includes(RoleEnum.ADMIN)) {
            throw new ForbiddenException();
        }

        return await this.getDetailedUserInfoDto(userId);
    }

    async updateDetailedUserInfo(
        id: number,
        {
            sportRankId,
            documents,
            status,
            comment,
            reverificationAt
        }: Partial<AdminDetailedUserInfoRequestDto>
    ) {
        const sportRankExists = await this.sportRankService.exists(sportRankId);

        if (!sportRankExists) {
            throw new NotFoundException('Разряд не найден');
        }

        // TODO: если загружает обычный пользователь, то необходимо проверить, что файл его
        const filesExists = await this.fileService.exists(
            documents.map(d => d.fileId)
        );

        if (!filesExists) {
            throw new NotFoundException('Файл не найден');
        }

        const oldDocuments = await this.prismaService.document.findMany({
            where: { userId: id },
            select: { fileId: true }
        });

        const newFileIds = new Set(documents.map(d => d.fileId));
        const fileIdsToDelete = oldDocuments
            .map(d => d.fileId)
            .filter(fileId => !newFileIds.has(fileId));

        await this.prismaService.$transaction(async tx => {
            await tx.user.update({
                where: { id },
                data: {
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
                                comment,
                                reverificationAt: reverificationAt
                                    ? new Date(reverificationAt)
                                    : null
                            }
                        }
                    }
                }
            });

            await Promise.all(
                fileIdsToDelete.map(fileId =>
                    this.fileService.delete(fileId, tx)
                )
            );
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
