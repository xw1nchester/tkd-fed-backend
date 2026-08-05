import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { FileDto } from '@file/dto/file-response.dto';

export class TeamResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Медитация' })
    name: string;

    @ApiPropertyOptional({
        type: FileDto,
        nullable: true
    })
    logo: FileDto | null;

    @ApiProperty({ example: '2026-02-28T17:00:00.000Z' })
    createdAt: string;

    @ApiProperty({ example: '2026-02-28T17:00:00.000Z' })
    updatedAt: string;

    @ApiProperty({ example: 5 })
    membersCount: number;
}

export class TeamWrapperResponseDto {
    @ApiProperty({ type: TeamResponseDto })
    team: TeamResponseDto;
}
