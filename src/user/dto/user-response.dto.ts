import { FileDto } from '@file/dto/file-response.dto';
import { ApiProperty } from '@nestjs/swagger';

class RoleDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'judge' })
    name: string;
}

export class UserResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'user@example.com' })
    email: string;

    @ApiProperty({ type: FileDto })
    avatar: FileDto;

    @ApiProperty({ example: 'Дружков' })
    lastName: string;

    @ApiProperty({ example: 'Василий' })
    firstName: string;

    @ApiProperty({ example: 'Александрович' })
    middleName: string;

    @ApiProperty({ example: '2024-06-01' })
    birthDate: string;

    @ApiProperty({ example: true })
    isVerified: boolean;

    @ApiProperty({ default: 2500 })
    rating: number;

    @ApiProperty({ type: RoleDto })
    role: RoleDto;
}

export class TeamShortResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Медитация' })
    name: string;
}

export class InvitedUserResponseDto extends UserResponseDto {
    @ApiProperty({ type: TeamShortResponseDto, isArray: true })
    teams: [];
}

export class UserWrapperResponseDto {
    @ApiProperty({ type: UserResponseDto })
    user: UserResponseDto;
}
