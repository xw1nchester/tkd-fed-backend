import { Gender } from '@prisma-client';
import {
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

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

    @ApiProperty({
        enum: Gender,
        example: Gender.MALE
    })
    @IsEnum(Gender)
    gender: Gender;

    @ApiProperty({ example: 'Дружков Василий Александрович' })
    @IsString()
    @IsOptional()
    firstTrainer: string;
}
