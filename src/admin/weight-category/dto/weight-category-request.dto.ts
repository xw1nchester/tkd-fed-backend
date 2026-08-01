import { Gender } from '@prisma-client';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsPositive, ValidateIf } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class WeightCategoryRequestDto {
    @ApiProperty({ example: 1 })
    @IsNumber()
    @Transform(({ value }) => Number(value))
    ageCategoryId: number;

    @ApiProperty({ enum: Gender, example: Gender.MALE })
    @IsEnum(Gender)
    gender: Gender;

    @ApiProperty({ example: 60 })
    @IsNumber()
    @Transform(({ value }) =>
        value === null || value === undefined ? value : Number(value)
    )
    @IsPositive()
    @ValidateIf(dto => typeof dto.maxWeight === 'undefined')
    minWeight: number;

    @ApiProperty({ example: 65 })
    @IsNumber()
    @Transform(({ value }) =>
        value === null || value === undefined ? value : Number(value)
    )
    @IsPositive()
    @ValidateIf(dto => typeof dto.minWeight === 'undefined')
    maxWeight: number;
}
