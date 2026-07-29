import { Transform, Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsNotEmpty,
    IsNumber,
    ValidateNested
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

class AthleteRequestUpdateDto {
    @ApiProperty({ example: 1 })
    @Transform(({ value }) => Number(value))
    @IsNumber()
    athleteId: number;

    @ApiProperty({ example: 1 })
    @Transform(({ value }) => Number(value))
    @IsNumber()
    weightCategoryId: number;
}

export class TournamentRequestUpdateDto {
    @ApiProperty({ example: 'ООО Рога и Копыта' })
    @IsNotEmpty()
    organization: string;

    @ApiProperty({ type: AthleteRequestUpdateDto, isArray: true })
    @Transform(({ value }) => {
        if (!Array.isArray(value)) return value;

        const unique = new Map<number, any>();

        for (const athlete of value) {
            if (!unique.has(Number(athlete.athleteId))) {
                unique.set(Number(athlete.athleteId), athlete);
            }
        }

        return [...unique.values()];
    })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => AthleteRequestUpdateDto)
    athletes: AthleteRequestUpdateDto[];
}
