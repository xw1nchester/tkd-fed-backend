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
import { TournamentService } from './tournament.service';
import { CurrentUser, Public, Role } from '@auth/decorators';
import { JwtPayload } from '@auth/interfaces';
import { TournamentRequestDto } from './dto/tournament-request.dto';
import {
    ApiBearerAuth,
    ApiExtraModels,
    ApiOkResponse,
    getSchemaPath
} from '@nestjs/swagger';
import {
    TournamentResponseDto,
    TournamentWrapperResponseDto
} from './dto/tournament-response.dto';
import { RoleGuard } from '@auth/guards/role.guard';
import { RoleEnum } from '@shared/enums/role.enum';
import { PaginationResponseDto } from '@shared/dto/pagination-response.dto';
import { OptionalJwtAuthGuard } from '@auth/guards/optional-jwt-auth.guard';
import { TournamentQueryDto } from './dto/tournament-query.dto';

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
}
