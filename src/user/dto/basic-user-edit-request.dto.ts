import { ApiProperty } from '@nestjs/swagger';
import {
    IsDateString,
    IsNotEmpty,
    IsOptional,
    IsString
} from 'class-validator';

export class BasicUserEditRequestDto {
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
}
