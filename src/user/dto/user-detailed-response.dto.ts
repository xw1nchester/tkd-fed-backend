import { BeltResponseDto } from '@belt/dto/belt-response.dto';
import { FileDto } from '@file/dto/file-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { VerificationStatus } from '@prisma-client';
import { SportRankResponseDto } from '@sport-rank/dto/sport-rank-response.dto';

class DocumentDto {
    @ApiProperty({ example: 6 })
    id: number;

    @ApiProperty({ example: 'PASSPORT' })
    type: string;

    @ApiProperty({ example: '2026-06-10T06:21:37.632Z' })
    createdAt: string;

    @ApiProperty({ type: FileDto })
    file: FileDto;
}

class DocumentVerificationDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({
        enum: VerificationStatus,
        example: VerificationStatus.PENDING
    })
    status: VerificationStatus;

    @ApiProperty({ example: 'Не видно цифры' })
    comment: string;

    @ApiProperty({ example: '2026-06-10T06:17:04.079Z' })
    createdAt: string;

    @ApiProperty({ example: '2026-06-10T06:21:37.632Z' })
    updatedAt: string;

    @ApiProperty({ example: '2024-06-01' })
    reverificationAt: string;
}

class UserDetailedResponseDto {
    @ApiProperty({ type: BeltResponseDto })
    belt: BeltResponseDto;

    @ApiProperty({ type: SportRankResponseDto })
    sportRank: SportRankResponseDto;

    @ApiProperty({ type: [DocumentDto] })
    documents: DocumentDto[];

    @ApiProperty({ type: DocumentVerificationDto })
    documentVerification: DocumentVerificationDto;
}

export class UserDetailedWrapperResponseDto {
    @ApiProperty({ type: UserDetailedResponseDto })
    user: UserDetailedResponseDto;
}
