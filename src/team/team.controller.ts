import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards
} from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamCreateRequestDto } from './dto/team-create-request.dto';
import { CurrentUser, Role } from '@auth/decorators';
import { JwtPayload } from '@auth/interfaces';
import { PaginationQueryDto } from '@shared/dto/pagination-query.dto';
import {
    ApiBearerAuth,
    ApiExtraModels,
    ApiOkResponse,
    getSchemaPath
} from '@nestjs/swagger';
import {
    TeamResponseDto,
    TeamWrapperResponseDto
} from './dto/team-response.dto';
import { RoleGuard } from '@auth/guards/role.guard';
import { RoleEnum } from '@shared/enums/role.enum';
import { PaginationResponseDto } from '@shared/dto/pagination-response.dto';
import { TeamUpdateRequestDto } from './dto/team-update-request.dto';
import { IdsRequestDto } from '@shared/dto/ids-request.dto';

@UseGuards(RoleGuard)
@Role(RoleEnum.TRAINER)
@Controller('team')
export class TeamController {
    constructor(private readonly teamService: TeamService) {}

    @Post()
    @ApiBearerAuth()
    @ApiOkResponse({ type: TeamWrapperResponseDto })
    async create(
        @Body() dto: TeamCreateRequestDto,
        @CurrentUser() user: JwtPayload
    ) {
        return await this.teamService.create(dto, user.id);
    }

    @Get()
    @ApiBearerAuth()
    @ApiExtraModels(PaginationResponseDto, TeamResponseDto)
    @ApiOkResponse({
        schema: {
            allOf: [
                {
                    properties: {
                        data: {
                            type: 'array',
                            items: { $ref: getSchemaPath(TeamResponseDto) }
                        }
                    }
                },
                { $ref: getSchemaPath(PaginationResponseDto) }
            ]
        }
    })
    async findAll(
        @Query() query: PaginationQueryDto,
        @CurrentUser() user: JwtPayload
    ) {
        return await this.teamService.findAll({ query, creatorId: user.id });
    }

    @Get(':id')
    @ApiOkResponse({ type: TeamWrapperResponseDto })
    async getById(@Param('id', ParseIntPipe) id: number) {
        return await this.teamService.getDtoById(id);
    }

    @Patch(':id')
    @ApiBearerAuth()
    @ApiOkResponse({ type: TeamWrapperResponseDto })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: JwtPayload,
        @Body() dto: TeamUpdateRequestDto
    ) {
        return await this.teamService.update(id, user.id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @ApiOkResponse({ type: TeamWrapperResponseDto })
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: JwtPayload
    ) {
        return await this.teamService.remove(id, user.id);
    }

    @Post(':id/members/bulk-add')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth()
    @ApiOkResponse({ type: TeamWrapperResponseDto })
    async addMembers(
        @Param('id', ParseIntPipe) teamId: number,
        @Body() dto: IdsRequestDto,
        @CurrentUser() user: JwtPayload
    ) {
        await this.teamService.addMembers(teamId, dto.ids, user.id);
    }

    @Post(':id/members/bulk-remove')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth()
    @ApiOkResponse({ type: TeamWrapperResponseDto })
    async removeMembers(
        @Param('id', ParseIntPipe) teamId: number,
        @Body() dto: IdsRequestDto,
        @CurrentUser() user: JwtPayload
    ) {
        await this.teamService.removeMembers(teamId, dto.ids, user.id);
    }
}
