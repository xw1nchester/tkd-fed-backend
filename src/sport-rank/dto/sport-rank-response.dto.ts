import { ApiProperty } from '@nestjs/swagger';

export class SportRankResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Кандидат в мастера спорта' })
    name: string;
}

export class SportRanksResponseDto {
    @ApiProperty({ type: SportRankResponseDto, isArray: true })
    sportRanks: SportRankResponseDto[];
}
