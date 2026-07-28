import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class PaginationQueryDto {
    @ApiProperty({
        example: 1,
        required: false
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiProperty({
        example: 10,
        required: false
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 5;
}
