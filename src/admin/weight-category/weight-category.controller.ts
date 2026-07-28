import {
    Body,
    Controller,
    Delete,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Role } from '@auth/decorators';
import { RoleGuard } from '@auth/guards/role.guard';
import { RoleEnum } from '@shared/enums/role.enum';
import { WeightCategoryWrapperResponseDto } from '@weight-category/dto/weight-category-response.dto';
import { WeightCategoryService } from '@weight-category/weight-category.service';

import { WeightCategoryRequestDto } from './dto/weight-category-request.dto';

@ApiTags('Admin')
@UseGuards(RoleGuard)
@Role(RoleEnum.ADMIN)
@Controller('admin/weight-category')
export class WeightCategoryController {
    constructor(
        private readonly weightCategoryService: WeightCategoryService
    ) {}

    @Post()
    @ApiBearerAuth()
    @ApiOkResponse({ type: WeightCategoryWrapperResponseDto })
    async create(@Body() dto: WeightCategoryRequestDto) {
        return await this.weightCategoryService.create(dto);
    }

    @Patch(':id')
    @ApiBearerAuth()
    @ApiOkResponse({ type: WeightCategoryWrapperResponseDto })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: WeightCategoryRequestDto
    ) {
        return await this.weightCategoryService.update(id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @ApiOkResponse({ type: WeightCategoryWrapperResponseDto })
    async remove(@Param('id', ParseIntPipe) id: number) {
        return await this.weightCategoryService.remove(id);
    }
}
