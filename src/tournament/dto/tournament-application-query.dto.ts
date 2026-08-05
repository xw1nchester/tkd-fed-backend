import { Expose, Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { PaginationQueryDto } from '@shared/dto/pagination-query.dto';

export class TournamentApplicationQueryDto extends PaginationQueryDto {
    @ApiProperty({
        name: 'tournament_id',
        example: 1,
        required: false
    })
    @Type(() => Number)
    @IsInt()
    @Expose({ name: 'tournament_id' })
    @IsOptional()
    tournamentId: number;

    @ApiProperty({ example: true, required: false })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === '' || value === undefined || value === null) {
            return undefined;
        }

        return (
            value === 'true' || value === true || value === 1 || value === '1'
        );
    })
    my?: boolean;
}
