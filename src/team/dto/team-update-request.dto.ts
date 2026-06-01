import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TeamUpdateRequestDto {
    @ApiProperty({ example: 'Старшая группа' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'e7cb06e8-1335-4b5c-bb46-0edfd4015aa1.jpeg' })
    @IsString()
    @IsOptional()
    logoKey: string;
}
