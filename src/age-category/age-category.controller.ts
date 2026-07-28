import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';

import { Public } from '@auth/decorators';

import { AgeCategoryService } from './age-category.service';
import {
    AgeCategoriesResponseDto,
    AgeCategoryWrapperResponseDto
} from './dto/age-category-response.dto';

@Controller('age-category')
export class AgeCategoryController {
    constructor(private readonly ageCategoryService: AgeCategoryService) {}

    @Public()
    @Get()
    @ApiOkResponse({ type: AgeCategoriesResponseDto })
    async findAll() {
        return await this.ageCategoryService.findAll();
    }

    @Public()
    @Get(':id')
    @ApiOkResponse({ type: AgeCategoryWrapperResponseDto })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return await this.ageCategoryService.getDtoById(id);
    }
}
