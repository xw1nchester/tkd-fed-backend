import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class AvatarRequestDto {
    @ApiProperty({ example: 1 })
    @IsNumber()
    @Transform(({ value }) => Number(value))
    fileId: number;
}
