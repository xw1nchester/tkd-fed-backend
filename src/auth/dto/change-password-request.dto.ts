import { IsNotEmpty, IsString, MinLength } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordRequestDto {
    @ApiProperty({ example: 'newPassword123' })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    oldPassword: string;

    @ApiProperty({ example: 'newPassword123' })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    newPassword: string;
}
