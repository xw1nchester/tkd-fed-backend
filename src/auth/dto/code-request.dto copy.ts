import { IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CodeRequestDto {
    @ApiProperty({ example: '060128' })
    @IsString()
    @IsNotEmpty()
    code: string;
}
