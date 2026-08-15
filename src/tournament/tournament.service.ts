import {
    AgeCategory,
    File,
    Gender,
    Prisma,
    Role,
    Tournament,
    TournamentFile,
    TournamentRequest,
    TournamentRequestAthlete,
    User,
    WeightCategory
} from '@prisma-client';

import {
    BadRequestException,
    Injectable,
    NotFoundException
} from '@nestjs/common';

import { JwtPayload } from '@auth/interfaces';
import { FileService } from '@file/file.service';
import { PrismaService } from '@prisma/prisma.service';
import { PaginationQueryDto } from '@shared/dto/pagination-query.dto';
import { PaginationDto } from '@shared/dto/pagination.dto';
import { RoleEnum } from '@shared/enums/role.enum';
import { UserService } from '@user/services/user.service';
import { WeightCategoryService } from '@weight-category/weight-category.service';

import { TournamentApplicationQueryDto } from './dto/tournament-application-query.dto';
import { TournamentApplicationRequestDto } from './dto/tournament-application-request.dto';
import { TournamentQueryDto } from './dto/tournament-query.dto';
import { TournamentRequestDto } from './dto/tournament-request.dto';
import { TournamentStatus } from './enums/tournament-status.enum';
import {
    buildTournamentRequestXlsx,
    TournamentRequestXlsxAthlete
} from './tournament-request-xlsx.builder';

@Injectable()
export class TournamentService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly userService: UserService,
        private readonly weightCategoryService: WeightCategoryService,
        private readonly fileService: FileService
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

    createDto(
        tournament: Tournament & {
            creator: User & { roles: Role[]; avatar: File };
            logo?: File;
            banner?: File;
            files?: (TournamentFile & { file: File })[];
        }
    ) {
        delete tournament.creatorId;
        delete tournament.logoId;
        delete tournament.bannerId;

        return {
            ...tournament,
            creator: this.userService.createDto(tournament.creator),
            logo: this.fileService.createPublicDto(tournament.logo),
            banner: this.fileService.createPublicDto(tournament.banner),
            ...(tournament?.files && {
                files: tournament.files.map(
                    ({ id, name, createdAt, file }) => ({
                        id,
                        name,
                        createdAt,
                        file: this.fileService.createPublicDto(file)
                    })
                )
            }),
            status: this.getTournamentStatus(
                tournament.startDate,
                tournament.endDate
            )
        };
    }

    async getById(id: number) {
        const tournament = await this.prismaService.tournament.findUnique({
            where: { id },
            include: {
                logo: true,
                banner: true,
                files: {
                    include: {
                        file: true
                    }
                },
                creator: { include: { avatar: true, roles: true } }
            }
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
            where: { id, ...accessWhere },
            include: {
                logo: true,
                banner: true,
                files: {
                    include: {
                        file: true
                    }
                },
                creator: { include: { avatar: true, roles: true } }
            }
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
        const { files, ...tournamentData } = dto;

        this.validateDates(startDate, endDate);
        await this.validateTournamentFiles(dto);

        const tournament = await this.prismaService.tournament.create({
            data: {
                ...tournamentData,
                startDate,
                endDate,
                creatorId,
                files: {
                    create: files.map(({ name, fileId }) => ({
                        name,
                        fileId
                    }))
                }
            },
            include: {
                logo: true,
                banner: true,
                files: {
                    include: {
                        file: true
                    }
                },
                creator: { include: { avatar: true, roles: true } }
            }
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
                include: {
                    logo: true,
                    banner: true,
                    creator: { include: { avatar: true, roles: true } }
                },
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

    private async validateTournamentFiles(dto: TournamentRequestDto) {
        const fileIds = [
            dto.logoId,
            dto.bannerId,
            ...dto.files.map(file => file.fileId)
        ].filter((id): id is number => id !== undefined && id !== null);

        if (!fileIds.length) {
            return;
        }

        const filesExist = await this.fileService.exists(fileIds);

        if (!filesExist) {
            throw new NotFoundException('Файл не найден');
        }
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

    private ensureCanModerateRequest(
        request: TournamentRequest & { tournament: Tournament },
        user: JwtPayload
    ) {
        if (user.roles.includes(RoleEnum.SECRETARY)) {
            return;
        }

        if (
            user.roles.includes(RoleEnum.TRAINER) &&
            request.tournament.creatorId === user.id
        ) {
            return;
        }

        throw new NotFoundException('Заявка на турнир не найдена');
    }

    async update(id: number, user: JwtPayload, dto: TournamentRequestDto) {
        const existingTournament = await this.getById(id);
        this.ensureCanModify(existingTournament, user);

        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);
        const { files, ...tournamentData } = dto;

        this.validateDates(startDate, endDate);
        await this.validateTournamentFiles(dto);

        const retainedFileIds = new Set(
            [
                dto.logoId,
                dto.bannerId,
                ...(files ?? existingTournament.files).map(file => file.fileId)
            ].filter((fileId): fileId is number => !!fileId)
        );

        await this.prismaService.$transaction(async tx => {
            await tx.tournament.update({
                where: { id },
                data: {
                    ...tournamentData,
                    startDate,
                    endDate,
                    ...(files !== undefined && {
                        files: {
                            deleteMany: {},
                            create: files.map(({ name, fileId }) => ({
                                name,
                                fileId
                            }))
                        }
                    })
                }
            });

            if (
                existingTournament.logoId &&
                existingTournament.logoId != dto.logoId &&
                !retainedFileIds.has(existingTournament.logoId)
            ) {
                await this.fileService.delete(existingTournament.logoId, tx);
            }

            if (
                existingTournament.bannerId &&
                existingTournament.bannerId != dto.bannerId &&
                !retainedFileIds.has(existingTournament.bannerId)
            ) {
                await this.fileService.delete(existingTournament.bannerId, tx);
            }
        });

        return this.getDtoById({ id, requesterUser: user });
    }

    async remove(id: number, user: JwtPayload) {
        const existingTournament = await this.getById(id);
        this.ensureCanModify(existingTournament, user);

        await this.prismaService.$transaction(async tx => {
            await tx.tournament.delete({ where: { id } });

            // TODO: удалять также прикрепленные файлы
            for (const fileId of new Set([
                existingTournament.logoId,
                existingTournament.bannerId
            ])) {
                if (fileId) await this.fileService.delete(fileId, tx);
            }
        });

        return { tournament: this.createDto(existingTournament) };
    }

    async getRequestById(requestId: number, requesterUser?: JwtPayload) {
        const tournamentRequest =
            await this.prismaService.tournamentRequest.findFirst({
                include: {
                    trainer: { include: { avatar: true, roles: true } },
                    tournament: true,
                    _count: {
                        select: {
                            athletes: true
                        }
                    }
                },
                where: {
                    id: requestId,
                    ...this.getRequestAccessWhere(requesterUser)
                }
            });

        if (!tournamentRequest) {
            throw new NotFoundException('Заявка на турнир не найдена');
        }

        return tournamentRequest;
    }

    createRequestDto(
        request: TournamentRequest & {
            trainer: User & { roles: Role[] };
            tournament: Tournament;
            _count: { athletes: number };
        }
    ) {
        return {
            id: request.id,
            organization: request.organization,
            approvalOrganizationLine1: request.approvalOrganizationLine1,
            approvalOrganizationLine2: request.approvalOrganizationLine2,
            approvalPersonName: request.approvalPersonName,
            athleteCity: request.athleteCity,
            athleteFederalDistrict: request.athleteFederalDistrict,
            athleteSportsSociety: request.athleteSportsSociety,
            teamRepresentativeName: request.teamRepresentativeName,
            isAccepted: request.isAccepted,
            trainer: this.userService.createDto(request.trainer),
            athletesCount: request._count.athletes,
            tournament: {
                id: request.tournament.id,
                name: request.tournament.name,
                status: this.getTournamentStatus(
                    request.tournament.startDate,
                    request.tournament.endDate
                )
            },
            createdAt: request.createdAt,
            updatedAt: request.updatedAt
        };
    }

    async getRequestDtoById({
        id,
        requesterUser
    }: {
        id: number;
        requesterUser: JwtPayload;
    }) {
        const request = await this.prismaService.tournamentRequest.findFirst({
            where: { id, ...this.getRequestAccessWhere(requesterUser) },
            include: {
                trainer: { include: { avatar: true, roles: true } },
                tournament: true,
                _count: { select: { athletes: true } }
            }
        });

        if (!request) {
            throw new NotFoundException('Заявка на турнир не найдена');
        }

        return { tournamentRequest: this.createRequestDto(request) };
    }

    async getLatestRequestXlsxFieldsDtoByUserId(userId: number) {
        const request = await this.prismaService.tournamentRequest.findFirst({
            where: {
                trainerId: userId
            },
            orderBy: { createdAt: 'desc' }
        });

        return {
            approvalOrganizationLine1: request?.approvalOrganizationLine1 || null,
            approvalOrganizationLine2: request?.approvalOrganizationLine2 || null,
            approvalPersonName: request?.approvalPersonName || null,
            athleteCity: request?.athleteCity || null,
            athleteFederalDistrict: request?.athleteFederalDistrict || null,
            athleteSportsSociety: request?.athleteSportsSociety || null,
            teamRepresentativeName: request?.teamRepresentativeName || null
        };
    }

    private createAthleteDto(
        athlete: TournamentRequestAthlete & {
            athlete: User & { roles: Role[]; avatar: File };
            weightCategory: any;
        }
    ) {
        return {
            id: athlete.id,
            athlete: this.userService.createDto(athlete.athlete),
            weightCategory: athlete.weightCategory
        };
    }

    private async validateRequestData(
        tournamentId: number,
        dto: TournamentApplicationRequestDto,
        trainerId: number,
        excludedRequestId?: number
    ) {
        const { maxParticipants, acceptedAthletesCount, startDate, endDate } =
            await this.getById(tournamentId);

        if (
            this.getTournamentStatus(startDate, endDate) !=
            TournamentStatus.UPCOMING
        ) {
            throw new BadRequestException(
                'В текущий момент не ведется набор на данный турнир'
            );
        }

        const athleteIds = dto.athletes.map(a => a.athleteId);

        await this.userService.validateAndGetInvitedUserIds(
            trainerId,
            athleteIds
        );

        await this.weightCategoryService.validateWeightCategoryIds([
            ...new Set(dto.athletes.map(a => a.weightCategoryId))
        ]);

        const requestsCount = await this.prismaService.tournamentRequest.count({
            where: {
                tournamentId,
                trainerId,
                id: { not: excludedRequestId }
            }
        });

        if (requestsCount > 0) {
            throw new BadRequestException('Заявка на данный турнир уже подана');
        }

        if (
            maxParticipants &&
            maxParticipants - acceptedAthletesCount - athleteIds.length < 0
        ) {
            throw new BadRequestException(
                'Недостаточно свободных мест для регистрации'
            );
        }
    }

    async createRequest(
        tournamentId: number,
        dto: TournamentApplicationRequestDto,
        trainer: JwtPayload
    ) {
        await this.validateRequestData(tournamentId, dto, trainer.id);

        const createdRequest =
            await this.prismaService.tournamentRequest.create({
                data: {
                    tournamentId,
                    organization: dto.organization,
                    ...this.getTournamentRequestXlsxData(dto),
                    trainerId: trainer.id,
                    athletes: {
                        create: dto.athletes.map(
                            ({ athleteId, weightCategoryId }) => ({
                                athleteId,
                                weightCategoryId
                            })
                        )
                    }
                } as any
            });

        return this.getRequestDtoById({
            id: createdRequest.id,
            requesterUser: trainer
        });
    }

    private getRequestAccessWhere(
        user?: JwtPayload
    ): Prisma.TournamentRequestWhereInput {
        if (!user) {
            return { isAccepted: true };
        }

        if (user.roles.includes(RoleEnum.SECRETARY)) {
            return {};
        }

        if (user.roles.includes(RoleEnum.TRAINER)) {
            return {
                OR: [
                    { trainerId: user.id },
                    { tournament: { creatorId: user.id } }
                ]
            };
        }

        return { isAccepted: true };
    }

    async findAllRequests(
        query: TournamentApplicationQueryDto,
        requesterUser?: JwtPayload
    ) {
        const { page, limit, tournamentId, my } = query;

        const accessWhere = this.getRequestAccessWhere(requesterUser);
        const filterWhere: Prisma.TournamentRequestWhereInput = {};

        if (tournamentId != undefined) {
            filterWhere.tournamentId = tournamentId;
        }

        if (my && requesterUser) {
            filterWhere.trainerId = requesterUser.id;
        }

        const where: Prisma.TournamentRequestWhereInput = {
            AND: [accessWhere, filterWhere]
        };

        const skip = (page - 1) * limit;

        const [requests, total] = await this.prismaService.$transaction([
            this.prismaService.tournamentRequest.findMany({
                where,
                include: {
                    trainer: { include: { avatar: true, roles: true } },
                    tournament: true,
                    _count: { select: { athletes: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            this.prismaService.tournamentRequest.count({
                where
            })
        ]);

        const dtos = requests.map(r => this.createRequestDto(r));

        return new PaginationDto(dtos, total, page, limit);
    }

    async findRequestAthletes(
        requestId: number,
        query: PaginationQueryDto,
        requesterUser?: JwtPayload
    ) {
        await this.getRequestById(requestId, requesterUser);

        const { page, limit } = query;
        const where = { requestId };
        const skip = (page - 1) * limit;
        const [athletes, total] = await this.prismaService.$transaction([
            this.prismaService.tournamentRequestAthlete.findMany({
                where,
                include: {
                    athlete: {
                        include: {
                            roles: true,
                            avatar: true,
                            belt: true,
                            sportRank: true
                        }
                    },
                    weightCategory: true
                },
                orderBy: { id: 'asc' },
                skip,
                take: limit
            }),
            this.prismaService.tournamentRequestAthlete.count({ where })
        ]);

        return new PaginationDto(
            athletes.map(athlete => this.createAthleteDto(athlete)),
            total,
            page,
            limit
        );
    }

    async generateRequestXlsx(id: number, requesterUser: JwtPayload) {
        void requesterUser;

        const request = await this.prismaService.tournamentRequest.findFirst({
            where: { id, ...this.getRequestAccessWhere(requesterUser) },
            // where: { id },
            include: {
                tournament: true,
                athletes: {
                    include: {
                        athlete: {
                            include: {
                                belt: true,
                                invitedBy: true,
                                sportRank: true
                            }
                        },
                        weightCategory: {
                            include: {
                                ageCategory: true
                            }
                        }
                    },
                    orderBy: { id: 'asc' }
                }
            }
        });

        if (!request) {
            throw new NotFoundException('Заявка на турнир не найдена');
        }

        const xlsxRequest = request as typeof request;

        const athletes: TournamentRequestXlsxAthlete[] = request.athletes.map(
            ({ athlete, weightCategory }) => ({
                gender: this.formatGender(athlete.gender),
                fullName: this.formatUserFullName(athlete),
                birthDate: athlete.birthDate,
                weightCategory: this.formatWeightCategory(weightCategory),
                ageCategory: this.formatAgeCategory(
                    weightCategory.ageCategory,
                    request.tournament.startDate
                ),
                sportRank: athlete.sportRank?.name ?? '',
                belt: athlete.belt?.name ?? '',
                city: xlsxRequest.athleteCity ?? '',
                federalDistrict: xlsxRequest.athleteFederalDistrict ?? '',
                department: xlsxRequest.athleteSportsSociety ?? '',
                organization: request.organization,
                firstTrainer: this.formatTrainerNames(
                    athlete.firstTrainer,
                    athlete.invitedBy
                )
            })
        );

        const buffer = await buildTournamentRequestXlsx({
            tournamentName: request.tournament.name,
            tournamentCity: request.tournament.city,
            startDate: request.tournament.startDate,
            endDate: request.tournament.endDate,
            approvalOrganizationLine1: xlsxRequest.approvalOrganizationLine1,
            approvalOrganizationLine2: xlsxRequest.approvalOrganizationLine2,
            approvalPersonName: xlsxRequest.approvalPersonName,
            representativeName: xlsxRequest.teamRepresentativeName ?? '',
            athletes
        });

        return {
            buffer,
            filename: this.createXlsxFilename(request.organization)
        };
    }

    private createXlsxFilename(organization: string): string {
        const safeOrganization = organization
            .replace(/[<>:"/\\|?*]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        return `${safeOrganization || 'tournament-request'}.xlsx`;
    }

    private formatGender(gender: Gender): string {
        return gender === Gender.FEMALE ? 'д' : 'м';
    }

    private formatUserFullName(
        user: Pick<User, 'lastName' | 'firstName' | 'middleName'>
    ): string {
        return [user.lastName, user.firstName, user.middleName]
            .filter(Boolean)
            .join(' ');
    }

    private formatTrainerNames(
        firstTrainer: string,
        currentTrainer?: Pick<User, 'lastName' | 'firstName' | 'middleName'>
    ): string {
        return [
            this.formatTrainerNameString(firstTrainer),
            currentTrainer &&
                this.formatUserFullNameWithInitials(currentTrainer)
        ]
            .filter(Boolean)
            .join(', ');
    }

    private formatTrainerNameString(fullName?: string): string {
        if (!fullName) {
            return '';
        }

        const normalized = fullName.trim().replace(/\s+/g, ' ');

        if (/^[^\s]+\s+[А-ЯЁA-Z]\.\s*[А-ЯЁA-Z]\.?$/i.test(normalized)) {
            return normalized;
        }

        const [lastName, firstName, middleName] = normalized.split(' ');

        if (!lastName || !firstName) {
            return normalized;
        }

        return [
            lastName,
            [firstName, middleName]
                .filter(Boolean)
                .map(name => `${name[0]}.`)
                .join(' ')
        ]
            .filter(Boolean)
            .join(' ');
    }

    private formatUserFullNameWithInitials(
        user: Pick<User, 'lastName' | 'firstName' | 'middleName'>
    ): string {
        const initials = [user.firstName, user.middleName]
            .filter(Boolean)
            .map(name => `${name[0]}.`)
            .join(' ');

        return [user.lastName, initials].filter(Boolean).join(' ');
    }

    private formatWeightCategory(
        category: Pick<WeightCategory, 'minWeight' | 'maxWeight'>
    ): string {
        if (category.minWeight !== null && category.maxWeight !== null) {
            return `${category.minWeight}-${category.maxWeight}`;
        }

        if (category.maxWeight !== null) {
            return `${category.maxWeight}`;
        }

        if (category.minWeight !== null) {
            return `${category.minWeight}+`;
        }

        return '';
    }

    private formatAgeCategory(
        category: Pick<AgeCategory, 'name' | 'minAge' | 'maxAge'>,
        tournamentStartDate: Date
    ): string {
        const tournamentYear = tournamentStartDate.getFullYear();
        const youngestBirthYear = tournamentYear - category.minAge;

        if (category.maxAge === null) {
            return `${category.name} ${youngestBirthYear} г.р. и старше`;
        }

        const oldestBirthYear = tournamentYear - category.maxAge;

        if (oldestBirthYear === youngestBirthYear) {
            return `${category.name} ${youngestBirthYear} г.р.`;
        }

        return `${category.name} ${oldestBirthYear} - ${youngestBirthYear} г.р.`;
    }

    private getTournamentRequestXlsxData(dto: TournamentApplicationRequestDto) {
        return {
            approvalOrganizationLine1: dto.approvalOrganizationLine1,
            approvalOrganizationLine2: dto.approvalOrganizationLine2,
            approvalPersonName: dto.approvalPersonName,
            athleteCity: dto.athleteCity,
            athleteFederalDistrict: dto.athleteFederalDistrict,
            athleteSportsSociety: dto.athleteSportsSociety,
            teamRepresentativeName: dto.teamRepresentativeName
        };
    }

    async updateRequest(
        id: number,
        user: JwtPayload,
        dto: TournamentApplicationRequestDto
    ) {
        const request = await this.getRequestById(id, user);

        if (request.isAccepted) {
            throw new BadRequestException('Заявка уже принята');
        }

        await this.validateRequestData(request.tournamentId, dto, user.id, id);

        await this.prismaService.tournamentRequest.update({
            where: { id },
            data: {
                organization: dto.organization,
                ...this.getTournamentRequestXlsxData(dto),
                athletes: {
                    deleteMany: {},
                    create: dto.athletes.map(
                        ({ athleteId, weightCategoryId }) => ({
                            athleteId,
                            weightCategoryId
                        })
                    )
                }
            } as any
        });

        return this.getRequestDtoById({ id, requesterUser: user });
    }

    async removeRequest(id: number, user: JwtPayload) {
        const request = await this.getRequestById(id, user);
        const dto = this.createRequestDto(request);

        if (request.isAccepted) {
            throw new BadRequestException('Заявка уже принята');
        }

        await this.prismaService.tournamentRequest.delete({
            where: { id }
        });

        return { tournamentRequest: dto };
    }

    async acceptRequest(id: number, requesterUser: JwtPayload) {
        await this.prismaService.$transaction(async tx => {
            const request = await tx.tournamentRequest.findFirst({
                where: { id },
                include: {
                    tournament: true,
                    _count: { select: { athletes: true } }
                }
            });

            if (!request) {
                throw new NotFoundException('Заявка на турнир не найдена');
            }

            this.ensureCanModerateRequest(request, requesterUser);

            if (request.isAccepted) {
                throw new BadRequestException('Заявка уже принята');
            }

            if (
                request.tournament.maxParticipants &&
                request.tournament.maxParticipants -
                    request.tournament.acceptedAthletesCount -
                    request._count.athletes <
                    0
            ) {
                throw new BadRequestException(
                    'Недостаточно свободных мест для регистрации'
                );
            }

            await tx.tournamentRequest.update({
                where: { id },
                data: {
                    isAccepted: true
                }
            });

            await tx.tournament.update({
                where: {
                    id: request.tournamentId
                },
                data: {
                    acceptedAthletesCount: {
                        increment: request._count.athletes
                    }
                }
            });
        });

        return this.getRequestDtoById({
            id,
            requesterUser
        });
    }

    async rejectRequest(id: number, requesterUser: JwtPayload) {
        await this.prismaService.$transaction(async tx => {
            const request = await tx.tournamentRequest.findFirst({
                where: { id },
                include: {
                    tournament: true,
                    _count: { select: { athletes: true } }
                }
            });

            if (!request) {
                throw new NotFoundException('Заявка на турнир не найдена');
            }

            this.ensureCanModerateRequest(request, requesterUser);

            if (!request.isAccepted) {
                throw new BadRequestException('Заявка еще не принята');
            }

            await tx.tournamentRequest.update({
                where: { id },
                data: {
                    isAccepted: false
                }
            });

            await tx.tournament.update({
                where: {
                    id: request.tournamentId
                },
                data: {
                    acceptedAthletesCount: {
                        decrement: request._count.athletes
                    }
                }
            });
        });

        return this.getRequestDtoById({
            id,
            requesterUser
        });
    }
}
