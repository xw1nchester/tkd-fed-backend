import { Transform, Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AthleteRequestDto {
    @ApiProperty({ example: 1 })
    @Transform(({ value }) => Number(value))
    @IsNumber()
    athleteId: number;

    @ApiProperty({ example: 1 })
    @Transform(({ value }) => Number(value))
    @IsNumber()
    weightCategoryId: number;
}

export class TournamentApplicationRequestDto {
    @ApiProperty({ example: 'ООО Рога и Копыта' })
    @IsString()
    @IsNotEmpty()
    organization: string;

    @ApiPropertyOptional({
        example: 'Президент Тюменской Региональной Общественной'
    })
    @IsOptional()
    @IsString()
    approvalOrganizationLine1?: string;

    @ApiPropertyOptional({
        example: 'Организации Олимпийского Тхэквондо "Сила Духа"'
    })
    @IsOptional()
    @IsString()
    approvalOrganizationLine2?: string;

    @ApiPropertyOptional({ example: 'Нестеренков Д.А.' })
    @IsOptional()
    @IsString()
    approvalPersonName?: string;

    @ApiPropertyOptional({ example: 'Тюмень' })
    @IsOptional()
    @IsString()
    athleteCity?: string;

    @ApiPropertyOptional({ example: 'УрФО' })
    @IsOptional()
    @IsString()
    athleteFederalDistrict?: string;

    @ApiPropertyOptional({ example: 'МинОбр' })
    @IsOptional()
    @IsString()
    athleteSportsSociety?: string;

    @ApiPropertyOptional({ example: 'Нестеренков Д.А.' })
    @IsOptional()
    @IsString()
    teamRepresentativeName?: string;

    @ApiProperty({ type: AthleteRequestDto, isArray: true })
    @Transform(({ value }) => {
        if (!Array.isArray(value)) return value;

        const unique = new Map<number, any>();

        for (const athlete of value) {
            // если встретился повтор, останется первый элемент
            if (!unique.has(Number(athlete.athleteId))) {
                unique.set(Number(athlete.athleteId), athlete);
            }
        }

        return [...unique.values()];
    })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => AthleteRequestDto)
    athletes: AthleteRequestDto[];
}
