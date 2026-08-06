import { File, Prisma, Team } from '@prisma-client';

import {
    ForbiddenException,
    Injectable,
    NotFoundException
} from '@nestjs/common';

import { FileService } from '@file/file.service';
import { PrismaService } from '@prisma/prisma.service';
import { PaginationQueryDto } from '@shared/dto/pagination-query.dto';
import { PaginationDto } from '@shared/dto/pagination.dto';
import { UserService } from '@user/services/user.service';

import { TeamCreateRequestDto } from './dto/team-create-request.dto';
import { TeamUpdateRequestDto } from './dto/team-update-request.dto';

@Injectable()
export class TeamService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly userService: UserService,
        private readonly fileService: FileService
    ) {}

    createDto(
        team: Team & {
            logo?: File;
            _count: {
                members: number;
            };
        }
    ) {
        delete team.creatorId;
        delete team.logoId;

        return {
            id: team.id,
            name: team.name,
            logo: this.fileService.createPublicDto(team.logo),
            createdAt: team.createdAt,
            updatedAt: team.updatedAt,
            membersCount: team._count.members
        };
    }

    async getById(id: number) {
        const team = await this.prismaService.team.findFirst({
            where: { id },
            include: {
                logo: true,
                _count: { select: { members: true } }
            }
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
        await this.userService.validateAndGetInvitedUserIds(
            creatorId,
            dto.memberIds
        );
        await this.validateTeamFiles(dto);

        const createdTeam = await this.prismaService.team.create({
            data: {
                name: dto.name,
                logoId: dto.logoId,
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
            include: {
                logo: true,
                _count: { select: { members: true } }
            },
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

    private async validateTeamFiles(dto: TeamUpdateRequestDto) {
        if (dto.logoId === undefined || dto.logoId === null) {
            return;
        }

        const fileExists = await this.fileService.exists(dto.logoId);

        if (!fileExists) {
            throw new NotFoundException('Файл не найден');
        }
    }

    async update(id: number, creatorId: number, dto: TeamUpdateRequestDto) {
        const existingTeam = await this.getById(id);

        if (existingTeam.creatorId != creatorId) {
            throw new ForbiddenException();
        }

        await this.validateTeamFiles(dto);

        await this.prismaService.$transaction(async tx => {
            await tx.team.update({
                where: { id },
                data: {
                    name: dto.name,
                    logoId: dto.logoId
                }
            });

            if (existingTeam.logoId && existingTeam.logoId !== dto.logoId) {
                await this.fileService.delete(existingTeam.logoId, tx);
            }
        });

        return await this.getDtoById(id);
    }

    async remove(id: number, creatorId: number) {
        const existingTeam = await this.getById(id);

        if (existingTeam.creatorId != creatorId) {
            throw new ForbiddenException();
        }

        const logoId = existingTeam.logoId;
        const dto = { team: this.createDto(existingTeam) };

        await this.prismaService.$transaction(async tx => {
            await tx.team.delete({ where: { id } });

            if (logoId) {
                await this.fileService.delete(logoId, tx);
            }
        });

        return dto;
    }

    async addMembers(teamId: number, memberIds: number[], creatorId: number) {
        const team = await this.getById(teamId);

        if (team.creatorId !== creatorId) {
            throw new ForbiddenException();
        }

        await this.userService.validateAndGetInvitedUserIds(
            creatorId,
            memberIds
        );

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
