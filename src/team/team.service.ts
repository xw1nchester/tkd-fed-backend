import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { TeamRequestDto } from './dto/team-request.dto';
import { UserService } from '@user/user.service';
import { Prisma, Team } from '@prisma-client';
import { ConfigService } from '@nestjs/config';
import { PaginationQueryDto } from '@shared/dto/pagination-query.dto';
import { PaginationDto } from '@shared/dto/pagination.dto';

@Injectable()
export class TeamService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly userService: UserService,
        private readonly configService: ConfigService
    ) {}

    createDto(
        team: Team & {
            _count: {
                members: number;
            };
        }
    ) {
        const staticUrl = this.configService.get('STATIC_URL');
        const logoUrl = team.logoKey ? `${staticUrl}/${team.logoKey}` : null;

        return {
            id: team.id,
            name: team.name,
            logoKey: team.logoKey,
            logoUrl,
            createdAt: team.createdAt,
            updatedAt: team.updatedAt,
            membersCount: team._count.members
        };
    }

    async getById(id: number) {
        const team = await this.prismaService.team.findFirst({
            where: { id },
            include: { _count: { select: { members: true } } }
        });

        if (!team) {
            throw new NotFoundException('Команда не найдена');
        }

        return team;
    }

    async getDtoById(id: number) {
        const team = await this.getById(id);
        return { team: this.createDto(team) };
    }

    async create(dto: TeamRequestDto, creatorId: number) {
        await this.userService.validateInvitedUserIds(creatorId, dto.memberIds);

        const createdTeam = await this.prismaService.team.create({
            data: {
                name: dto.name,
                logoKey: dto.logoKey,
                creatorId,
                members: {
                    connect: dto.memberIds.map(id => ({ id }))
                }
            }
        });

        return this.getDtoById(createdTeam.id);
    }

    async findAll({
        query,
        creatorId
    }: {
        query: PaginationQueryDto;
        creatorId?: number;
    }) {
        const { page, limit } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.TeamWhereInput = {
            ...(creatorId && {
                creatorId
            })
        };

        const data = await this.prismaService.team.findMany({
            where,
            include: { _count: { select: { members: true } } },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip
        });

        const totalCount = await this.prismaService.team.count({
            where
        });

        const dtos = data.map(t => this.createDto(t));

        return new PaginationDto(dtos, totalCount, page, limit);
    }
}
