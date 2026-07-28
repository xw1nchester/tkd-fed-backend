import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';

import { Public } from '@auth/decorators';

import { SportRanksResponseDto } from './dto/sport-rank-response.dto';
import { SportRankService } from './sport-rank.service';

@Controller('sport-rank')
export class SportRankController {
    constructor(private readonly sportRankService: SportRankService) {}

    @Public()
    @Get()
    @ApiOkResponse({ type: SportRanksResponseDto })
    async findAll() {
        return await this.sportRankService.findAll();
    }
}
