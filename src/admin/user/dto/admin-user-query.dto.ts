import { ApiProperty } from '@nestjs/swagger';
import { UserQueryDto } from '@user/dto/user-query.dto';
import { Expose, Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class AdminUserQueryDto extends UserQueryDto {
    @ApiProperty({
        name: 'role_id',
        example: 1,
        required: false
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Expose({ name: 'role_id' })
    roleId: number;
}
