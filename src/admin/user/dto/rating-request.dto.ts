import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class RatingRequestDto {
    @ApiProperty({ example: 1 })
    @IsNumber()
    @Transform(({ value }) => Number(value))
    userId: number;

    @ApiProperty({ example: 2500 })
    @IsNumber()
    @Transform(({ value }) => Number(value))
    delta: number;

    @ApiProperty({ example: 'За первенство' })
    @IsString()
    @IsOptional()
    reason: string;
}
