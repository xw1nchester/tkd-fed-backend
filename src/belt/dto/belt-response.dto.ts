import { ApiProperty } from '@nestjs/swagger';
import { BeltRankType } from '@prisma-client';

class BeltResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Красный' })
    name: string;

    @ApiProperty({ example: 'red', nullable: true })
    color: string;

    @ApiProperty({ example: null, nullable: true })
    stripeColor: string | null;

    @ApiProperty({ example: BeltRankType.GEUP, enum: BeltRankType })
    rankType: string;

    @ApiProperty({ example: 2 })
    rankNumber: number;

    @ApiProperty({ example: 9 })
    sortOrder: number;
}

export class BeltsResponseDto {
    @ApiProperty({ type: BeltResponseDto, isArray: true })
    belts: BeltResponseDto[];
}
