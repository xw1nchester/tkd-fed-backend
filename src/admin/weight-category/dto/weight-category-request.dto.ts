import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@prisma-client';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsPositive } from 'class-validator';

export class WeightCategoryRequestDto {
    @ApiProperty({ enum: Gender, example: Gender.MALE })
    @IsEnum(Gender)
    gender: Gender;

    @ApiProperty({ example: 80 })
    @IsNumber()
    @Transform(({ value }) => Number(value))
    @IsPositive()
    weight: number;
}
