import { ApiProperty } from '@nestjs/swagger';
import { PaginationQueryDto } from '@shared/dto/pagination-query.dto';
import { Expose, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class UserQueryDto extends PaginationQueryDto {
    @ApiProperty({
        example: 'Баклажан',
        required: false
    })
    @IsString()
    @IsOptional()
    search: string;

    // TODO: возможно стоит сделать только для тренера возможность получения участников команды
    // /team/:id/members
    @ApiProperty({
        name: 'team_id',
        example: 1,
        required: false
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Expose({ name: 'team_id' })
    teamId: number;
}
