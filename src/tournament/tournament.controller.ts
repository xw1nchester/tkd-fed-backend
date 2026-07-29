import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiExtraModels,
    ApiOkResponse,
    getSchemaPath
} from '@nestjs/swagger';

import { CurrentUser, Public, Role } from '@auth/decorators';
import { OptionalJwtAuthGuard } from '@auth/guards/optional-jwt-auth.guard';
import { RoleGuard } from '@auth/guards/role.guard';
import { JwtPayload } from '@auth/interfaces';
import { PaginationQueryDto } from '@shared/dto/pagination-query.dto';
import { PaginationResponseDto } from '@shared/dto/pagination-response.dto';
import { RoleEnum } from '@shared/enums/role.enum';

import { TournamentApplicationRequestDto } from './dto/tournament-application-request.dto';
import { TournamentQueryDto } from './dto/tournament-query.dto';
import {
    TournamentRequestResponseDto,
    TournamentRequestWrapperResponseDto,
    TournamentRequestAthleteResponseDto
} from './dto/tournament-request-response.dto';
import { TournamentRequestUpdateDto } from './dto/tournament-request-update-request.dto';
import { TournamentRequestDto } from './dto/tournament-request.dto';
import {
    TournamentResponseDto,
    TournamentWrapperResponseDto
} from './dto/tournament-response.dto';
import { TournamentService } from './tournament.service';
import { TournamentApplicationQueryDto } from './dto/tournament-application-query.dto';

@Controller('tournament')
export class TournamentController {
    constructor(private readonly tournamentService: TournamentService) {}

    @UseGuards(RoleGuard)
    @Role(RoleEnum.TRAINER, RoleEnum.SECRETARY)
    @Post()
    @ApiBearerAuth()
    @ApiOkResponse({ type: TournamentWrapperResponseDto })
    async create(
        @Body() dto: TournamentRequestDto,
        @CurrentUser() user: JwtPayload
    ) {
        return this.tournamentService.create(dto, user.id);
    }

    @Public()
    @UseGuards(OptionalJwtAuthGuard)
    @Get()
    @ApiExtraModels(PaginationResponseDto, TournamentResponseDto)
    @ApiOkResponse({
        schema: {
            allOf: [
                {
                    properties: {
                        data: {
                            type: 'array',
                            items: {
                                $ref: getSchemaPath(TournamentResponseDto)
                            }
                        }
                    }
                },
                { $ref: getSchemaPath(PaginationResponseDto) }
            ]
        }
    })
    async findAll(
        @Query() query: TournamentQueryDto,
        @CurrentUser() user: JwtPayload
    ) {
        return this.tournamentService.findAll({
            query,
            requesterUser: user
        });
    }

    @UseGuards(RoleGuard)
    @Role(RoleEnum.TRAINER, RoleEnum.SECRETARY)
    @Get('request')
    @ApiExtraModels(PaginationResponseDto, TournamentRequestResponseDto)
    @ApiOkResponse({
        schema: {
            allOf: [
                {
                    properties: {
                        data: {
                            type: 'array',
                            items: {
                                $ref: getSchemaPath(
                                    TournamentRequestResponseDto
                                )
                            }
                        }
                    }
                },
                { $ref: getSchemaPath(PaginationResponseDto) }
            ]
        }
    })
    async findAllRequests(
        @Query() query: TournamentApplicationQueryDto,
        @CurrentUser() user: JwtPayload
    ) {
        return this.tournamentService.findAllRequests(query, user);
    }

    @Public()
    @UseGuards(OptionalJwtAuthGuard)
    @Get(':id')
    @ApiOkResponse({ type: TournamentWrapperResponseDto })
    async findOne(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: JwtPayload
    ) {
        return this.tournamentService.getDtoById({
            id,
            requesterUser: user
        });
    }

    @UseGuards(RoleGuard)
    @Role(RoleEnum.TRAINER, RoleEnum.SECRETARY)
    @Patch(':id')
    @ApiBearerAuth()
    @ApiOkResponse({ type: TournamentWrapperResponseDto })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: JwtPayload,
        @Body() dto: TournamentRequestDto
    ) {
        return this.tournamentService.update(id, user, dto);
    }

    @UseGuards(RoleGuard)
    @Role(RoleEnum.TRAINER, RoleEnum.SECRETARY)
    @Delete(':id')
    @ApiBearerAuth()
    @ApiOkResponse({ type: TournamentWrapperResponseDto })
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: JwtPayload
    ) {
        return this.tournamentService.remove(id, user);
    }

    @UseGuards(RoleGuard)
    @Role(RoleEnum.TRAINER)
    @Post(':id/request')
    @ApiBearerAuth()
    async createRequest(
        @Param('id', ParseIntPipe) tournamentId: number,
        @Body() dto: TournamentApplicationRequestDto,
        @CurrentUser() user: JwtPayload
    ) {
        return await this.tournamentService.createRequest(
            tournamentId,
            dto,
            user
        );
    }

    @UseGuards(RoleGuard)
    @Role(RoleEnum.TRAINER, RoleEnum.SECRETARY)
    @Get('request/:id')
    @ApiOkResponse({ type: TournamentRequestWrapperResponseDto })
    async getRequestById(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: JwtPayload
    ) {
        return this.tournamentService.getRequestDtoById({
            id,
            requesterUser: user
        });
    }

    @UseGuards(RoleGuard)
    @Role(RoleEnum.TRAINER, RoleEnum.SECRETARY)
    @Get('request/:id/athletes')
    @ApiExtraModels(PaginationResponseDto, TournamentRequestAthleteResponseDto)
    @ApiOkResponse({
        schema: {
            allOf: [
                {
                    properties: {
                        data: {
                            type: 'array',
                            items: {
                                $ref: getSchemaPath(
                                    TournamentRequestAthleteResponseDto
                                )
                            }
                        }
                    }
                },
                { $ref: getSchemaPath(PaginationResponseDto) }
            ]
        }
    })
    async findRequestAthletes(
        @Param('id', ParseIntPipe) id: number,
        @Query() query: PaginationQueryDto,
        @CurrentUser() user: JwtPayload
    ) {
        return this.tournamentService.findRequestAthletes(id, query, user);
    }

    @UseGuards(RoleGuard)
    @Role(RoleEnum.TRAINER)
    @Patch('request/:id')
    @ApiOkResponse({ type: TournamentRequestWrapperResponseDto })
    async updateRequest(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: TournamentRequestUpdateDto,
        @CurrentUser() user: JwtPayload
    ) {
        return this.tournamentService.updateRequest(id, user, dto);
    }

    @UseGuards(RoleGuard)
    @Role(RoleEnum.TRAINER)
    @Delete('request/:id')
    @ApiOkResponse({ type: TournamentRequestWrapperResponseDto })
    async removeRequest(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: JwtPayload
    ) {
        return this.tournamentService.removeRequest(id, user);
    }

    @UseGuards(RoleGuard)
    @Role(RoleEnum.SECRETARY)
    @Patch('request/:id/accept')
    @ApiOkResponse({ type: TournamentRequestWrapperResponseDto })
    async acceptRequest(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: JwtPayload
    ) {
        return this.tournamentService.acceptRequest(id, user);
    }

    @UseGuards(RoleGuard)
    @Role(RoleEnum.SECRETARY)
    @Patch('request/:id/reject')
    @ApiOkResponse({ type: TournamentRequestWrapperResponseDto })
    async rejectRequest(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: JwtPayload
    ) {
        return this.tournamentService.rejectRequest(id, user);
    }
}
