import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CodeDto {
    @ApiProperty({ example: '060128' })
    @IsString()
    @IsNotEmpty()
    code: string;
}