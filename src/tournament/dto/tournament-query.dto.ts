import { ApiProperty } from '@nestjs/swagger';
import { PaginationQueryDto } from '@shared/dto/pagination-query.dto';
import { Expose, Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class TournamentQueryDto extends PaginationQueryDto {
    @ApiProperty({
        name: 'is_published',
        example: true,
        required: false
    })
    @Expose({ name: 'is_published' })
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
    isPublished?: boolean;

    @ApiProperty({ example: true, required: false })
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
    my?: boolean;
}
