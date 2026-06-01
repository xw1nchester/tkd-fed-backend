import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray } from 'class-validator';
import { TeamUpdateRequestDto } from './team-update-request.dto';

export class TeamCreateRequestDto extends TeamUpdateRequestDto {
    @ApiProperty({ example: [1, 2] })
    @IsArray()
    @Transform(({ value }) => [...new Set(value)])
    memberIds: number[];
}
