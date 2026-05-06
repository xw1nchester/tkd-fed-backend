import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamRequestDto } from './dto/team-request.dto';
import { CurrentUser } from '@auth/decorators';
import { JwtPayload } from '@auth/interfaces';
import { PaginationQueryDto } from '@shared/dto/pagination-query.dto';

@Controller('team')
export class TeamController {
    constructor(private readonly teamService: TeamService) {}

    @Post()
    async create(@Body() dto: TeamRequestDto, @CurrentUser() user: JwtPayload) {
        return await this.teamService.create(dto, user.id);
    }

    @Get()
    async findAll(
        @Query() query: PaginationQueryDto,
        @CurrentUser() user: JwtPayload
    ) {
        return await this.teamService.findAll({ query, creatorId: user.id });
    }

    @Get(':id')
    async getById(@Param('id', ParseIntPipe) id: number) {
      return await this.teamService.getDtoById(id);
    }
}
