import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { UserQueryDto } from './user-query.dto';

export class InvitedUserQueryDto extends UserQueryDto {
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
    
    @ApiProperty({
        name: 'excluded_team_id',
        example: 1,
        required: false
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Expose({ name: 'excluded_team_id' })
    excludedTeamId: number;
}
