import { ApiProperty } from "@nestjs/swagger";

class RoleResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'admin' })
    name: string;
}

export class RolesResponseDto {
    @ApiProperty({ type: RoleResponseDto, isArray: true })
    roles: RoleResponseDto[];
}