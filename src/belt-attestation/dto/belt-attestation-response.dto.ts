import { ApiProperty } from '@nestjs/swagger';
import { BeltResponseDto } from '@belt/dto/belt-response.dto';
import { UserResponseDto } from '@user/dto/user-response.dto';

export class BeltAttestationResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: '2026-08-15' })
    attestationDate: Date;

    @ApiProperty({ type: UserResponseDto })
    trainer: UserResponseDto;

    @ApiProperty({ example: false })
    isAccepted: boolean;

    @ApiProperty({ example: '2026-07-23T10:30:00.000Z' })
    createdAt: Date;

    @ApiProperty({ example: '2026-07-23T10:30:00.000Z' })
    updatedAt: Date;
}

export class BeltAttestationWrapperResponseDto {
    @ApiProperty({ type: BeltAttestationResponseDto })
    beltAttestationRequest: BeltAttestationResponseDto;
}

export class BeltAttestationAthleteResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ type: UserResponseDto })
    athlete: UserResponseDto;

    @ApiProperty({ type: BeltResponseDto, nullable: true })
    currentBelt: BeltResponseDto | null;

    @ApiProperty({ type: BeltResponseDto })
    requestedBelt: BeltResponseDto;
}
