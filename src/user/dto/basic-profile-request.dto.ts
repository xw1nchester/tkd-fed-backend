import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";

export class BasicProfileRequestDto {
    @ApiProperty({ example: 'Дружков' })
    @IsString()
    @IsOptional()
    lastName: string;

    @ApiProperty({ example: 'Василий' })
    @IsString()
    @IsOptional()
    firstName: string;

    @ApiProperty({ example: 'Александрович' })
    @IsString()
    @IsOptional()
    middleName: string;

    @ApiProperty({ example: '2024-06-01' })
    @IsDateString()
    birthDate: string;
}