import { ApiProperty } from '@nestjs/swagger';

class TokenCreatorDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Дружков' })
    lastName: string;

    @ApiProperty({ example: 'Василий' })
    firstName: string;

    @ApiProperty({ example: 'Александрович' })
    middleName: string;
}

class InviteTokenResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'e7cb06e8-1335-4b5c-bb46-0edfd4015aa1' })
    token: string;

    @ApiProperty({ example: '2026-02-28T17:00:00.000Z' })
    createdAt: string;

    @ApiProperty({ type: TokenCreatorDto })
    creator: TokenCreatorDto;
}

export class InviteTokenWrapperResponseDto {
    @ApiProperty({ type: InviteTokenResponseDto })
    token: InviteTokenResponseDto;
}

export class InviteTokensWrapperResponseDto {
    @ApiProperty({ type: InviteTokenResponseDto, isArray: true })
    tokens: InviteTokenResponseDto[];
}
