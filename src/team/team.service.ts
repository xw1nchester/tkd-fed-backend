import {
    ForbiddenException,
    Injectable,
    NotFoundException
} from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { TeamCreateRequestDto } from './dto/team-create-request.dto';
import { UserService } from '@user/services/user.service';
import { Prisma, Team } from '@prisma-client';
import { ConfigService } from '@nestjs/config';
import { PaginationQueryDto } from '@shared/dto/pagination-query.dto';
import { PaginationDto } from '@shared/dto/pagination.dto';
import { TeamUpdateRequestDto } from './dto/team-update-request.dto';

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

    async create(dto: TeamCreateRequestDto, creatorId: number) {
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

    async update(id: number, creatorId: number, dto: TeamUpdateRequestDto) {
        const existingTeam = await this.getById(id);

        if (existingTeam.creatorId != creatorId) {
            throw new ForbiddenException();
        }

        await this.prismaService.team.update({
            where: { id },
            data: {
                name: dto.name,
                logoKey: dto.logoKey
            }
        });

        return await this.getDtoById(id);
    }

    async remove(id: number, creatorId: number) {
        const existingTeam = await this.getById(id);

        if (existingTeam.creatorId != creatorId) {
            throw new ForbiddenException();
        }

        const dto = await this.getDtoById(id);

        await this.prismaService.team.delete({ where: { id } });

        return dto;
    }

    async addMembers(teamId: number, memberIds: number[], creatorId: number) {
        const team = await this.getById(teamId);

        if (team.creatorId !== creatorId) {
            throw new ForbiddenException();
        }

        await this.userService.validateInvitedUserIds(creatorId, memberIds);

        await this.prismaService.team.update({
            where: {
                id: teamId
            },
            data: {
                members: {
                    connect: memberIds.map(id => ({ id }))
                }
            }
        });
    }

    async removeMembers(
        teamId: number,
        memberIds: number[],
        creatorId: number
    ) {
        const team = await this.getById(teamId);

        if (team.creatorId !== creatorId) {
            throw new ForbiddenException();
        }

        await this.prismaService.team.update({
            where: {
                id: teamId
            },
            data: {
                members: {
                    disconnect: memberIds.map(id => ({ id }))
                }
            }
        });
    }
}
