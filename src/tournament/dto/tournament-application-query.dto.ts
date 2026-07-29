import { Expose, Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

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
}
