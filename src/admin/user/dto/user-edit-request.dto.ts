import { ApiProperty } from '@nestjs/swagger';
import { BasicUserEditRequestDto } from '@user/dto/basic-user-edit-request.dto';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsEmail, IsNotEmpty } from 'class-validator';

// TODO: вопрос: где должно храниться это dto, в админском модуле или в модуле пользователей
export class UserEditRequestDto extends BasicUserEditRequestDto {
    @ApiProperty({ example: 'user@example.com' })
    @Transform(({ value }) => value.toLowerCase())
    @IsEmail()
    email: string;

    @ApiProperty({ example: true })
    @IsBoolean()
    @IsNotEmpty()
    isVerified: boolean;

    @ApiProperty({ example: [1, 2] })
    @IsArray()
    @Transform(({ value }) => [...new Set(value)])
    roleIds: number[];
}
