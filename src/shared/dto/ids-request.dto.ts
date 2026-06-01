import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray } from 'class-validator';

export class IdsRequestDto {
    @ApiProperty({ example: [1, 2] })
    @IsArray()
    @ArrayMinSize(1)
    ids: number[];
}
