import { genSaltSync, hashSync } from 'bcrypt';

import { Injectable, NotFoundException } from '@nestjs/common';

import { AuthRequestDto } from '@auth/dto/auth-request.dto';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class UserService {
    constructor(private readonly prismaService: PrismaService) {}

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
}
