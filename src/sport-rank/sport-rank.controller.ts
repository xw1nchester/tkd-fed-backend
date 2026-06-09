import { Controller, Get } from '@nestjs/common';
import { SportRankService } from './sport-rank.service';
import { Public } from '@auth/decorators';
import { ApiOkResponse } from '@nestjs/swagger';
import { SportRanksResponseDto } from './dto/sport-rank-response.dto';

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
