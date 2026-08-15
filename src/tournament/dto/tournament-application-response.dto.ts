import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { UserResponseDto } from '@user/dto/user-response.dto';
import { WeightCategoryResponseDto } from '@weight-category/dto/weight-category-response.dto';

import { TournamentShortResponseDto } from './tournament-response.dto';

export class TournamentApplicationResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'ООО Рога и Копыта' })
    organization: string;

    @ApiPropertyOptional({
        example: 'Президент Тюменской Региональной Общественной'
    })
    approvalOrganizationLine1?: string;

    @ApiPropertyOptional({
        example: 'Организации Олимпийского Тхэквондо "Сила Духа"'
    })
    approvalOrganizationLine2?: string;

    @ApiPropertyOptional({ example: 'Нестеренков Д.А.' })
    approvalPersonName?: string;

    @ApiPropertyOptional({ example: 'Тюмень' })
    athleteCity?: string;

    @ApiPropertyOptional({ example: 'УрФО' })
    athleteFederalDistrict?: string;

    @ApiPropertyOptional({ example: 'МинОбр' })
    athleteSportsSociety?: string;

    @ApiPropertyOptional({ example: 'Нестеренков Д.А.' })
    teamRepresentativeName?: string;

    @ApiProperty({ type: UserResponseDto })
    trainer: UserResponseDto;

    @ApiProperty({ example: false })
    isAccepted: boolean;

    @ApiProperty({ example: 3 })
    athletesCount: number;

    @ApiProperty({ type: TournamentShortResponseDto })
    tournament: TournamentShortResponseDto;

    @ApiProperty({ example: '2026-07-23T10:30:00.000Z' })
    createdAt: Date;

    @ApiProperty({ example: '2026-07-23T10:30:00.000Z' })
    updatedAt: Date;
}

export class TournamentRequestWrapperResponseDto {
    @ApiProperty({ type: TournamentApplicationResponseDto })
    tournamentRequest: TournamentApplicationResponseDto;
}

export class TournamentRequestXlsxFieldsResponseDto {
    @ApiPropertyOptional({
        example: 'Президент Тюменской Региональной Общественной'
    })
    approvalOrganizationLine1?: string;

    @ApiPropertyOptional({
        example: 'Организации Олимпийского Тхэквондо "Сила Духа"'
    })
    approvalOrganizationLine2?: string;

    @ApiPropertyOptional({ example: 'Нестеренков Д.А.' })
    approvalPersonName?: string;

    @ApiPropertyOptional({ example: 'Тюмень' })
    athleteCity?: string;

    @ApiPropertyOptional({ example: 'УрФО' })
    athleteFederalDistrict?: string;

    @ApiPropertyOptional({ example: 'МинОбр' })
    athleteSportsSociety?: string;

    @ApiPropertyOptional({ example: 'Нестеренков Д.А.' })
    teamRepresentativeName?: string;
}

export class TournamentRequestXlsxFieldsWrapperResponseDto {
    @ApiProperty({
        type: TournamentRequestXlsxFieldsResponseDto,
        nullable: true
    })
    xlsxFields: TournamentRequestXlsxFieldsResponseDto | null;
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
