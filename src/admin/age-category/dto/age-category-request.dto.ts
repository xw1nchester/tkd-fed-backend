import { Transform } from 'class-transformer';
import {
    IsNotEmpty,
    IsNumber,
    IsPositive,
    IsString,
    ValidateIf
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class AgeCategoryRequestDto {
    @ApiProperty({ example: 'Молодежка' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 16 })
    @IsNumber()
    @Transform(({ value }) =>
        value === null || value === undefined ? value : Number(value)
    )
    @IsPositive()
    @ValidateIf(dto => dto.maxAge === null || dto.maxAge === undefined)
    minAge: number;

    @ApiProperty({ example: 20 })
    @IsNumber()
    @Transform(({ value }) =>
        value === null || value === undefined ? value : Number(value)
    )
    @IsPositive()
    @ValidateIf(dto => dto.minAge === null || dto.minAge === undefined)
    maxAge: number;
}
