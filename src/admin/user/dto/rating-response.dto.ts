import { ApiProperty } from '@nestjs/swagger';
import { UserBasicResponseDto } from '@user/dto/user-response.dto';

export class RatingTransactionResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 2500 })
    delta: number;

    @ApiProperty({ example: 'За первенство' })
    reason: string;

    @ApiProperty({ example: '2026-02-28T17:00:00.000Z' })
    createdAt: string;

    @ApiProperty({ example: 1 })
    userId: number;

    @ApiProperty({ type: UserBasicResponseDto })
    admin: UserBasicResponseDto;
}

export class RatingTransactionWrapperResponseDto {
    @ApiProperty({ type: RatingTransactionResponseDto })
    ratingTransaction: RatingTransactionResponseDto;
}
