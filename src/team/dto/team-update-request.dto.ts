import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TeamUpdateRequestDto {
    @ApiProperty({ example: 'Старшая группа' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ example: 1, nullable: true })
    @IsOptional()
    @IsInt()
    @Transform(({ value }) =>
        value === null || value === undefined ? value : Number(value)
    )
    logoId?: number | null;
}
