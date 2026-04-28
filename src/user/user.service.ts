import { genSaltSync, hashSync } from 'bcrypt';

import { Injectable, NotFoundException } from '@nestjs/common';

import { AuthRequestDto } from '@auth/dto/auth-request.dto';
import { PrismaService } from '@prisma/prisma.service';
import { Prisma, Role, User } from '@prisma-client';
import { ConfigService } from '@nestjs/config';
import { BasicProfileRequestDto } from './dto/basic-profile-request.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import { PaginationDto } from '@shared/dto/pagination.dto';

@Injectable()
export class UserService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly configService: ConfigService
    ) {}

    async getById(id: number) {
        const user = await this.prismaService.user.findFirst({
            where: { id },
            include: { roles: true }
        });

        if (!user) {
            throw new NotFoundException('');
        }

        return user;
    }

    async getByEmail(email: string) {
        return await this.prismaService.user.findFirst({
            where: { email },
            include: { roles: true }
        });
    }

    async create({ email, password }: AuthRequestDto) {
        const createdUser = await this.prismaService.user.create({
            data: {
                email,
                password: hashSync(password, genSaltSync(10))
            }
        });

        return await this.getById(createdUser.id);
    }

    async verify(id: number) {
        return await this.prismaService.user.update({
            where: {
                id
            },
            data: { isVerified: true }
        });
    }

    createDto(user: User & { roles: Role[] }) {
        const staticUrl = this.configService.get('STATIC_URL');
        const avatar = user.avatarKey ? `${staticUrl}/${user.avatarKey}` : null;

        return {
            id: user.id,
            email: user.email,
            avatar,
            firstName: user.firstName,
            lastName: user.lastName,
            middleName: user.middleName,
            birthDate: user.birthDate,
            isVerified: user.isVerified,
            roles: user.roles
        };
    }

    async getDtoById(id: number) {
        const user = await this.getById(id);
        return { user: this.createDto(user) };
    }

    async updateAvatar(id: number, avatarKey: string) {
        await this.getById(id);

        await this.prismaService.user.update({
            where: { id },
            data: { avatarKey }
        });

        return await this.getDtoById(id);
    }

    async deleteAvatar(id: number) {
        await this.getById(id);

        await this.prismaService.user.update({
            where: { id },
            data: { avatarKey: null }
        });

        return await this.getDtoById(id);
    }

    async updateBasicProfileInfo(id: number, dto: BasicProfileRequestDto) {
        await this.getById(id);

        await this.prismaService.user.update({
            where: { id },
            data: {
                firstName: dto.firstName,
                lastName: dto.lastName,
                middleName: dto.middleName,
                birthDate: new Date(dto.birthDate)
            }
        });

        return await this.getDtoById(id);
    }

    async findAll({
        query,
        onlyWithoutRoles = true
    }: {
        query: SearchQueryDto;
        onlyWithoutRoles?: boolean;
    }) {
        const { page, limit, search } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.UserWhereInput = {
            ...(onlyWithoutRoles && {
                roles: {
                    none: {}
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
            })
        };

        const data = await this.prismaService.user.findMany({
            where,
            include: { roles: true },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip
        });

        const totalCount = await this.prismaService.user.count({
            where
        });

        const dtos = data.map(u => this.createDto(u));

        return new PaginationDto(dtos, totalCount, page, limit);
    }
}
