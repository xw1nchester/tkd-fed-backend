import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RecoveryPasswordDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: '157014' })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({ example: 'newPassword123' })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;
}
