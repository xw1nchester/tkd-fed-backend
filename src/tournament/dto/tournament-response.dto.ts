import { IsEnum } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { FileDto } from '@file/dto/file-response.dto';

import { TournamentStatus } from '../enums/tournament-status.enum';

export class TournamentResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Открытый кубок города' })
    name: string;

    @ApiPropertyOptional({
        type: FileDto,
        nullable: true
    })
    logo: FileDto | null;

    @ApiPropertyOptional({
        type: FileDto,
        nullable: true
    })
    banner: FileDto | null;

    @ApiProperty({ example: '2026-08-15T09:00:00.000Z' })
    startDate: Date;

    @ApiProperty({ example: '2026-08-16T18:00:00.000Z' })
    endDate: Date;

    @ApiPropertyOptional({ example: 150 })
    acceptedAthletesCount: number;

    @ApiPropertyOptional({ example: 300, nullable: true })
    maxParticipants: number | null;

    @ApiProperty({ example: 'Екатеринбург' })
    city: string;

    @ApiProperty({ example: 'ул. Спортивная, 1' })
    address: string;

    @ApiPropertyOptional({ nullable: true })
    organizer: string | null;

    @ApiPropertyOptional({ nullable: true })
    chiefSecretary: string | null;

    @ApiPropertyOptional({ nullable: true })
    chiefJudge: string | null;

    @ApiPropertyOptional({ nullable: true })
    contacts: string | null;

    @ApiPropertyOptional({ nullable: true })
    description: string | null;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty({
        enum: TournamentStatus,
        example: TournamentStatus.UPCOMING,
        description:
            'UPCOMING - идет набор; ONGOING - в процессе; FINISHED - окончен'
    })
    @IsEnum(TournamentStatus)
    status?: TournamentStatus;
}

export class TournamentWrapperResponseDto {
    @ApiProperty({ type: TournamentResponseDto })
    tournament: TournamentResponseDto;
}
