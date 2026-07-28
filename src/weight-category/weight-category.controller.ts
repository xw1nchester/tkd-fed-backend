import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';

import { Public } from '@auth/decorators';

import {
    WeightCategoriesResponseDto,
    WeightCategoryWrapperResponseDto
} from './dto/weight-category-response.dto';
import { WeightCategoryService } from './weight-category.service';

@Controller('weight-category')
export class WeightCategoryController {
    constructor(
        private readonly weightCategoryService: WeightCategoryService
    ) {}

    @Public()
    @Get()
    @ApiOkResponse({ type: WeightCategoriesResponseDto })
    async findAll() {
        return await this.weightCategoryService.findAll();
    }

    @Public()
    @Get(':id')
    @ApiOkResponse({ type: WeightCategoryWrapperResponseDto })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return await this.weightCategoryService.getDtoById(id);
    }
}
