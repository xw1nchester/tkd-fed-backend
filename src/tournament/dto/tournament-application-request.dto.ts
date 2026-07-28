import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsString,
    ValidateNested
} from 'class-validator';

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
