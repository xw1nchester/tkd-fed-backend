import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class InviteTokenRequestDto {
    @ApiProperty({ example: 'e7cb06e8-1335-4b5c-bb46-0edfd4015aa1' })
    @IsString()
    @IsNotEmpty()
    token: string;
}
