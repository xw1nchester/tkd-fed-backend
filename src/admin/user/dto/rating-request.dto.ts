import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class RatingRequestDto {
    @ApiProperty({ default: 2500 })
    @IsNumber()
    @Transform(({ value }) => Number(value))
    delta: number;

    @ApiProperty({ example: 'За первенство' })
    @IsString()
    @IsOptional()
    reason: string;
}
