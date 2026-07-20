import {
    BadRequestException,
    Injectable,
    NotFoundException
} from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { Prisma, Tournament } from '@prisma-client';
import { TournamentRequestDto } from './dto/tournament-request.dto';
import { PaginationDto } from '@shared/dto/pagination.dto';
import { TournamentQueryDto } from './dto/tournament-query.dto';
import { TournamentStatus } from './enums/tournament-status.enum';

@Injectable()
export class TournamentService {
    constructor(private readonly prismaService: PrismaService) {}

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

    createDto(tournament: Tournament) {
        delete tournament.creatorId;
        return {
            ...tournament,
            status: this.getTournamentStatus(
                tournament.startDate,
                tournament.endDate
            )
        };
    }

    async getById(id: number) {
        const tournament = await this.prismaService.tournament.findUnique({
            where: { id }
        });

        if (!tournament) {
            throw new NotFoundException('Турнир не найден');
        }

        return tournament;
    }

    async getDtoById({
        id,
        requesterUserId
    }: {
        id: number;
        requesterUserId?: number;
    }) {
        const where: Prisma.TournamentWhereInput =
            requesterUserId !== undefined
                ? {
                      id,
                      OR: [
                          {
                              isPublished: true
                          },
                          {
                              creatorId: requesterUserId
                          }
                      ]
                  }
                : {
                      id,
                      isPublished: true
                  };

        const tournament = await this.prismaService.tournament.findFirst({
            where
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

        const tournament = await this.prismaService.tournament.create({
            data: { ...dto, startDate, endDate, creatorId }
        });

        return { tournament: this.createDto(tournament) };
    }

    async findAll({
        query,
        requesterUserId
    }: {
        query: TournamentQueryDto;
        requesterUserId?: number;
    }) {
        const { page, limit, isPublished, my } = query;
        const skip = (page - 1) * limit;

        const accessWhere: Prisma.TournamentWhereInput =
            requesterUserId !== undefined
                ? {
                      OR: [
                          {
                              isPublished: true
                          },
                          {
                              creatorId: requesterUserId
                          }
                      ]
                  }
                : {
                      isPublished: true
                  };

        const filterWhere: Prisma.TournamentWhereInput = {};

        if (isPublished !== undefined) {
            filterWhere.isPublished = isPublished;
        }

        if (my && requesterUserId !== undefined) {
            filterWhere.creatorId = requesterUserId;
        }

        const where: Prisma.TournamentWhereInput = {
            AND: [accessWhere, filterWhere]
        };

        const [tournaments, total] = await this.prismaService.$transaction([
            this.prismaService.tournament.findMany({
                where,
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

    private ensureCreator(tournament: Tournament, creatorId: number) {
        if (tournament.creatorId !== creatorId) {
            throw new NotFoundException();
        }
    }

    async update(id: number, creatorId: number, dto: TournamentRequestDto) {
        const existingTournament = await this.getById(id);
        this.ensureCreator(existingTournament, creatorId);

        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);

        this.validateDates(startDate, endDate);

        const tournament = await this.prismaService.tournament.update({
            where: { id },
            data: { ...dto, startDate, endDate }
        });

        return { tournament: this.createDto(tournament) };
    }

    async remove(id: number, creatorId: number) {
        const tournament = await this.getById(id);
        this.ensureCreator(tournament, creatorId);

        await this.prismaService.tournament.delete({ where: { id } });
        return { tournament: this.createDto(tournament) };
    }
}
