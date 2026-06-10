import { ApiProperty } from '@nestjs/swagger';
import { InvitedUserQueryDto } from '@user/dto/invited-user-query.dto';
import { Expose, Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class AdminUserQueryDto extends InvitedUserQueryDto {
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
