import { Transform } from 'class-transformer';
import { IsNumber } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class AvatarRequestDto {
    @ApiProperty({ example: 1 })
    @IsNumber()
    @Transform(({ value }) => Number(value))
    fileId: number;
}
