import { Gender } from '@prisma-client';

import { ApiProperty } from '@nestjs/swagger';

export class WeightCategoryResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ enum: Gender, example: Gender.MALE })
    gender: Gender;

    @ApiProperty({ example: 60 })
    minWeight: number;

    @ApiProperty({ example: 65 })
    maxWeight: number;
}

export class WeightCategoryWrapperResponseDto {
    @ApiProperty({ type: WeightCategoryResponseDto })
    weightCategory: WeightCategoryResponseDto;
}

export class WeightCategoriesResponseDto {
    @ApiProperty({ type: WeightCategoryResponseDto, isArray: true })
    weightCategories: WeightCategoryResponseDto[];
}
