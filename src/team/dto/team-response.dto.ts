import { ApiProperty } from '@nestjs/swagger';

export class TeamResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Медитация' })
    name: string;

    @ApiProperty({
        example: '64c43ba9-b062-4875-a989-291948999b4e.jpeg'
    })
    logoKey: string;

    @ApiProperty({
        example:
            'http://localhost:8080/static/64c43ba9-b062-4875-a989-291948999b4e.jpeg'
    })
    logoUrl: string;

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
