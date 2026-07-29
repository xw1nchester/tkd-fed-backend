import { ApiProperty } from '@nestjs/swagger';

import { UserResponseDto } from '@user/dto/user-response.dto';
import { WeightCategoryResponseDto } from '@weight-category/dto/weight-category-response.dto';

export class TournamentRequestResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'ООО Рога и Копыта' })
    organization: string;

    @ApiProperty({ type: UserResponseDto })
    trainer: UserResponseDto;

    @ApiProperty({ example: false })
    isAccepted: boolean;

    @ApiProperty({ example: 3 })
    athletesCount: number;

    @ApiProperty({ example: '2026-07-23T10:30:00.000Z' })
    createdAt: Date;

    @ApiProperty({ example: '2026-07-23T10:30:00.000Z' })
    updatedAt: Date;
}

export class TournamentRequestWrapperResponseDto {
    @ApiProperty({ type: TournamentRequestResponseDto })
    tournamentRequest: TournamentRequestResponseDto;
}

export class TournamentRequestAthleteResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ type: UserResponseDto })
    athlete: UserResponseDto;

    @ApiProperty({ type: WeightCategoryResponseDto })
    weightCategory: WeightCategoryResponseDto;

    @ApiProperty({ example: 'Василий Д.' })
    firstTrainer: string;
}
