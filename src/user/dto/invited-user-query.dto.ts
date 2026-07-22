import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';
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

    @ApiProperty({
        name: 'is_trainer',
        example: true,
        required: false
    })
    @Expose({ name: 'is_trainer' })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === '' || value === undefined || value === null) {
            return undefined;
        }

        return (
            value === 'true' || value === true || value === 1 || value === '1'
        );
    })
    isTrainer?: boolean;
}
