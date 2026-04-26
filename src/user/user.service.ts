import { genSaltSync, hashSync } from 'bcrypt';

import { Injectable, NotFoundException } from '@nestjs/common';

import { AuthRequestDto } from '@auth/dto/auth-request.dto';
import { PrismaService } from '@prisma/prisma.service';
import { Role, User } from '@prisma-client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly configService: ConfigService
    ) {}

    async getById(id: number) {
        const user = await this.prismaService.user.findFirst({
            where: { id },
            include: { role: true }
        });

        if (!user) {
            throw new NotFoundException('');
        }

        return user;
    }

    async getByEmail(email: string) {
        return await this.prismaService.user.findFirst({
            where: { email },
            include: { role: true }
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

    createDto(user: User & { role: Role }) {
        const { id, email, avatarKey, isVerified, role } = user;
        const staticUrl = this.configService.get('STATIC_URL');
        const avatar = avatarKey ? `${staticUrl}/${avatarKey}` : null;
        return { id, email, avatar, isVerified, role };
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
}
