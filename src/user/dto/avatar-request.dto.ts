import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AvatarRequestDto {
    @ApiProperty({ example: 'e7cb06e8-1335-4b5c-bb46-0edfd4015aa1.jpeg' })
    @IsString()
    key: string;
}
