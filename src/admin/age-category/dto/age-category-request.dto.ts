import { Transform } from 'class-transformer';
import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class AgeCategoryRequestDto {
    @ApiProperty({ example: 'Молодежка' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 16 })
    @IsNumber()
    @Transform(({ value }) => Number(value))
    @IsPositive()
    minAge: number;

    @ApiProperty({ example: 20 })
    @IsNumber()
    @Transform(({ value }) =>
        value === null || value === undefined ? value : Number(value)
    )
    @IsPositive()
    @IsOptional()
    maxAge: number;
}
