import { Controller, Get } from '@nestjs/common';
import { BeltService } from './belt.service';
import { Public } from '@auth/decorators';
import { ApiOkResponse } from '@nestjs/swagger';
import { BeltsResponseDto } from './dto/belt-response.dto';

@Controller('belt')
export class BeltController {
    constructor(private readonly beltService: BeltService) {}

    @Public()
    @Get()
    @ApiOkResponse({ type: BeltsResponseDto })
    async findAll() {
        return await this.beltService.findAll();
    }
}
