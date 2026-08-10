import { Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsDateString,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Min,
    ValidateNested
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TournamentFileType } from '@prisma-client';

class TournamentFileRequestDto {
    @ApiProperty({
        enum: TournamentFileType,
        example: TournamentFileType.REGULATION
    })
    @IsEnum(TournamentFileType)
    type: TournamentFileType;

    @ApiProperty({ example: 1 })
    @IsInt()
    @Transform(({ value }) => Number(value))
    fileId: number;
}

export class TournamentRequestDto {
    @ApiProperty({ example: 'Открытый кубок города' })
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

    @ApiPropertyOptional({ example: 2, nullable: true })
    @IsOptional()
    @IsInt()
    @Transform(({ value }) =>
        value === null || value === undefined ? value : Number(value)
    )
    bannerId?: number | null;

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

    @ApiProperty({ type: [TournamentFileRequestDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TournamentFileRequestDto)
    files: TournamentFileRequestDto[];

    @ApiProperty({ example: true })
    @IsBoolean()
    isPublished: boolean;
}
