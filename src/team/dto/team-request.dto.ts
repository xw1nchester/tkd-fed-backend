import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TeamRequestDto {
    @ApiProperty({ example: 'Старшая группа' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'e7cb06e8-1335-4b5c-bb46-0edfd4015aa1.jpeg' })
    @IsString()
    @IsOptional()
    logoKey: string;

    @ApiProperty({ example: [1, 2] })
    @IsArray()
    @Transform(({ value }) => [...new Set(value)])
    memberIds: number[];
}
