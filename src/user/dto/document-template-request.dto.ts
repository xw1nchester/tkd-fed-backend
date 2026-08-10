import { Transform } from 'class-transformer';
import { IsInt } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class DocumentTemplateRequestDto {
    @ApiProperty({ example: 1 })
    @IsInt()
    @Transform(({ value }) => Number(value))
    fileId: number;
}
