import { ApiProperty } from '@nestjs/swagger';

export class PaginationResponseDto {
    @ApiProperty({ example: 120 })
    total: number;

    @ApiProperty({ example: 4 })
    page: number;

    @ApiProperty({ example: 7 })
    totalPages: number;

    @ApiProperty({ example: false })
    isLast: number;
}
