import {
    Prisma,
    Role,
    Tournament,
    TournamentRequest,
    User
} from '@prisma-client';

import {
    BadRequestException,
    Injectable,
    NotFoundException
} from '@nestjs/common';

import { JwtPayload } from '@auth/interfaces';
import { PrismaService } from '@prisma/prisma.service';
import { PaginationDto } from '@shared/dto/pagination.dto';
import { RoleEnum } from '@shared/enums/role.enum';

import { TournamentQueryDto } from './dto/tournament-query.dto';
import { TournamentRequestDto } from './dto/tournament-request.dto';
import { TournamentStatus } from './enums/tournament-status.enum';
import { TournamentApplicationRequestDto } from './dto/tournament-application-request.dto';
import { UserService } from '@user/services/user.service';
import { WeightCategoryService } from '@weight-category/weight-category.service';

@Injectable()
export class TournamentService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly userService: UserService,
        private readonly weightCategoryService: WeightCategoryService
    ) {}

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
        requesterUser
    }: {
        id: number;
        requesterUser?: JwtPayload;
    }) {
        const accessWhere = this.getAccessWhere(requesterUser);

        const tournament = await this.prismaService.tournament.findFirst({
            where: { id, ...accessWhere }
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

    private getAccessWhere(user?: JwtPayload): Prisma.TournamentWhereInput {
        if (!user) {
            return {
                isPublished: true
            };
        }

        if (user.roles.includes(RoleEnum.SECRETARY)) {
            return {};
        }

        if (user.roles.includes(RoleEnum.TRAINER)) {
            return {
                OR: [
                    {
                        isPublished: true
                    },
                    {
                        creatorId: user.id
                    }
                ]
            };
        }

        return {
            isPublished: true
        };
    }

    async findAll({
        query,
        requesterUser
    }: {
        query: TournamentQueryDto;
        requesterUser?: JwtPayload;
    }) {
        const { page, limit, isPublished, my } = query;
        const skip = (page - 1) * limit;

        const accessWhere = this.getAccessWhere(requesterUser);

        const filterWhere: Prisma.TournamentWhereInput = {};

        if (isPublished !== undefined) {
            filterWhere.isPublished = isPublished;
        }

        if (my && requesterUser) {
            filterWhere.creatorId = requesterUser.id;
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

    private ensureCanModify(tournament: Tournament, user: JwtPayload) {
        if (user.roles.includes(RoleEnum.SECRETARY)) {
            return;
        }

        if (
            user.roles.includes(RoleEnum.TRAINER) &&
            tournament.creatorId === user.id
        ) {
            return;
        }

        throw new NotFoundException();
    }

    async update(id: number, user: JwtPayload, dto: TournamentRequestDto) {
        const existingTournament = await this.getById(id);
        this.ensureCanModify(existingTournament, user);

        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);

        this.validateDates(startDate, endDate);

        const tournament = await this.prismaService.tournament.update({
            where: { id },
            data: { ...dto, startDate, endDate }
        });

        return { tournament: this.createDto(tournament) };
    }

    async remove(id: number, user: JwtPayload) {
        const existingTournament = await this.getById(id);
        this.ensureCanModify(existingTournament, user);

        await this.prismaService.tournament.delete({ where: { id } });
        return { tournament: this.createDto(existingTournament) };
    }

    async getRequestById(requestId: number) {
        const tournamentRequest =
            await this.prismaService.tournamentRequest.findFirst({
                include: {
                    trainer: { include: { avatar: true, roles: true } }
                },
                where: { id: requestId }
            });

        if (!tournamentRequest) {
            throw new NotFoundException('Заявка на турнир не найдена');
        }

        return tournamentRequest;
    }

    createRequestDto(
        request: TournamentRequest & { trainer: User & { roles: Role[] } }
    ) {
        return {
            id: request.id,
            organization: request.organization,
            isAccepted: request.isAccepted,
            trainer: this.userService.createDto(request.trainer),
            createdAt: request.createdAt,
            updatedAt: request.updatedAt
        };
    }

    async getRequestDtoById(requestId: number) {
        const tournamentRequest = await this.getRequestById(requestId);
        return { tournamentRequest: this.createRequestDto(tournamentRequest) };
    }

    async createRequest(
        tournamentId: number,
        dto: TournamentApplicationRequestDto,
        trainerId: number
    ) {
        const existingTournament = await this.getById(tournamentId);

        await this.userService.validateAndGetInvitedUserIds(
            trainerId,
            dto.athletes.map(a => a.athleteId)
        );

        await this.weightCategoryService.validateWeightCategoryIds([
            ...new Set(dto.athletes.map(a => a.weightCategoryId))
        ]);

        // TODO: проверять что уже есть заявка с такими пользователями
        // TODO: проверить ограничение участников
        // - возможно стоит добавить поле tournament_id в tournament_request_athletes)
        // - или participants_count в tournaments

        const createdRequest =
            await this.prismaService.tournamentRequest.create({
                data: {
                    tournamentId: existingTournament.id,
                    organization: dto.organization,
                    trainerId,
                    athletes: {
                        create: dto.athletes.map(
                            ({ athleteId, weightCategoryId }) => ({
                                athleteId,
                                weightCategoryId
                            })
                        )
                    }
                }
            });

        return this.getRequestDtoById(createdRequest.id);
    }
}
