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

    @ApiProperty({ example: true })
    isVerified: boolean;

    @ApiProperty({ type: RoleDto })
    role: RoleDto;
}

export class UserWrapperResponseDto {
    @ApiProperty({ type: UserResponseDto })
    user: UserResponseDto;
}
