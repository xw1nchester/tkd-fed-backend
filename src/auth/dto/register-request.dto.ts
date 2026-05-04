import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsDateString,
    IsEmail,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    MinLength
} from 'class-validator';

export class RegisterRequestDto {
    @ApiProperty({ example: 'user@example.com' })
    @Transform(({ value }) => value.toLowerCase())
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'Дружков' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({ example: 'Василий' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ example: 'Александрович' })
    @IsString()
    @IsOptional()
    middleName: string;

    @ApiProperty({ example: '2024-06-01' })
    @IsDateString()
    birthDate: string;

    @ApiProperty({ example: 'StrongPass123!', minLength: 8 })
    @IsString()
    @MinLength(8)
    password: string;

    @Transform(({ value }) => Number(value))
    @IsNumber()
    @IsOptional()
    inviterId: number;
}
