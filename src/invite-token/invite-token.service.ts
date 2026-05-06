import {
    BadRequestException,
    Injectable,
    NotFoundException
} from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { InviteTokenRequestDto } from './dto/token-request.dto';
import { InviteToken, User } from '@prisma-client';

@Injectable()
export class InviteTokenService {
    constructor(private readonly prismaService: PrismaService) {}

    createDto(token: InviteToken & { creator: User }) {
        return {
            id: token.id,
            token: token.token,
            createdAt: token.createdAt,
            creator: {
                id: token.creator.id,
                firstName: token.creator.firstName,
                lastName: token.creator.lastName,
                middleName: token.creator.middleName
            }
        };
    }

    async getDtoById(id: number) {
        const token = await this.prismaService.inviteToken.findFirst({
            where: { id },
            include: { creator: true }
        });

        if (!token) {
            throw new NotFoundException('Ссылка для приглашения не найдена');
        }

        return this.createDto(token);
    }

    async getByToken(token: string) {
        return await this.prismaService.inviteToken.findFirst({
            where: { token }
        });
    }

    async create({ token }: InviteTokenRequestDto, creatorId: number) {
        const existingToken = this.getByToken(token);

        if (existingToken) {
            throw new BadRequestException(
                'Ссылка для приглашения с таким названием уже существует'
            );
        }

        const createdToken = await this.prismaService.inviteToken.create({
            data: { token, creatorId }
        });

        return { token: await this.getDtoById(createdToken.id) };
    }

    async findAllByCreatorId(creatorId: number) {
        const data = await this.prismaService.inviteToken.findMany({
            where: { creatorId },
            include: { creator: true }
        });

        return { tokens: data.map(t => this.createDto(t)) };
    }

    async deleteByIdAndCreatorId(id: number, creatorId: number) {
        const existingToken = await this.prismaService.inviteToken.findFirst({
            where: { id, creatorId }
        });

        if (!existingToken) {
            throw new NotFoundException('Ссылка для приглашения не найдена');
        }

        await this.prismaService.inviteToken.delete({ where: { id } });
    }
}
