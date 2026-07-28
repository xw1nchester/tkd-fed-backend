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

import { AgeCategoryService } from '@age-category/age-category.service';
import { AgeCategoryWrapperResponseDto } from '@age-category/dto/age-category-response.dto';
import { Role } from '@auth/decorators';
import { RoleGuard } from '@auth/guards/role.guard';
import { RoleEnum } from '@shared/enums/role.enum';

import { AgeCategoryRequestDto } from './dto/age-category-request.dto';

@ApiTags('Admin')
@UseGuards(RoleGuard)
@Role(RoleEnum.ADMIN)
@Controller('admin/age-category')
export class AgeCategoryController {
    constructor(private readonly ageCategoryService: AgeCategoryService) {}

    @Post()
    @ApiBearerAuth()
    @ApiOkResponse({ type: AgeCategoryWrapperResponseDto })
    async create(@Body() dto: AgeCategoryRequestDto) {
        return await this.ageCategoryService.create(dto);
    }

    @Patch(':id')
    @ApiBearerAuth()
    @ApiOkResponse({ type: AgeCategoryWrapperResponseDto })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AgeCategoryRequestDto
    ) {
        return await this.ageCategoryService.update(id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @ApiOkResponse({ type: AgeCategoryWrapperResponseDto })
    async remove(@Param('id', ParseIntPipe) id: number) {
        return await this.ageCategoryService.remove(id);
    }
}
