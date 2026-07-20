import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsDateString,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Min
} from 'class-validator';
import { Type } from 'class-transformer';

export class TournamentRequestDto {
    @ApiProperty({ example: 'Открытый кубок города' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
    @IsOptional()
    @IsString()
    logo?: string;

    @ApiPropertyOptional({ example: 'https://example.com/banner.png' })
    @IsOptional()
    @IsString()
    banner?: string;

    @ApiProperty({ example: '2024-06-01' })
    @IsDateString()
    startDate: string;

    @ApiProperty({ example: '2024-08-31' })
    @IsDateString()
    endDate: string;

    @ApiPropertyOptional({ example: 300, minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    maxParticipants?: number;

    @ApiProperty({ example: 'Екатеринбург' })
    @IsString()
    @IsNotEmpty()
    city: string;

    @ApiProperty({ example: 'ул. Спортивная, 1' })
    @IsString()
    @IsNotEmpty()
    address: string;

    @ApiPropertyOptional({ example: 'Федерация тхэквондо' })
    @IsOptional()
    @IsString()
    organizer?: string;

    @ApiPropertyOptional({ example: 'Иванов И.И.' })
    @IsOptional()
    @IsString()
    chiefSecretary?: string;

    @ApiPropertyOptional({ example: 'Петров П.П.' })
    @IsOptional()
    @IsString()
    chiefJudge?: string;

    @ApiPropertyOptional({ example: '+7 999 123-45-67' })
    @IsOptional()
    @IsString()
    contacts?: string;

    @ApiPropertyOptional({ example: 'Регламент и дополнительная информация.' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: true })
    @IsBoolean()
    isPublished: boolean;
}
