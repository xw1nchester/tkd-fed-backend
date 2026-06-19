import { ApiProperty } from '@nestjs/swagger';
import { PaginationQueryDto } from '@shared/dto/pagination-query.dto';
import { Expose, Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class RatingQueryDto extends PaginationQueryDto {
    @ApiProperty({
        name: 'user_id',
        example: 1,
        required: false
    })
    @Type(() => Number)
    @IsInt()
    @Expose({ name: 'user_id' })
    // @IsOptional()
    userId: number;
}
