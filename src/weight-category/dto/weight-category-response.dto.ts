import { Gender } from '@prisma-client';

import { ApiProperty } from '@nestjs/swagger';

class WeightCategoryResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ enum: Gender, example: Gender.MALE })
    gender: Gender;

    @ApiProperty({ example: 80 })
    weight: number;
}

export class WeightCategoryWrapperResponseDto {
    @ApiProperty({ type: WeightCategoryResponseDto })
    weightCategory: WeightCategoryResponseDto;
}

export class WeightCategoriesResponseDto {
    @ApiProperty({ type: WeightCategoryResponseDto, isArray: true })
    weightCategories: WeightCategoryResponseDto[];
}
