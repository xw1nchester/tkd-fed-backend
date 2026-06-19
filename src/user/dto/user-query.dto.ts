import { ApiProperty } from '@nestjs/swagger';
import { PaginationQueryDto } from '@shared/dto/pagination-query.dto';
import { Expose, Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum SortOption {
    CREATED_AT = 'createdAt',
    RATING = 'rating'
}

export enum OrderOption {
    ASC = 'asc',
    DESC = 'desc'
}

export class UserQueryDto extends PaginationQueryDto {
    @ApiProperty({
        example: 'Баклажан',
        required: false
    })
    @IsString()
    @IsOptional()
    search: string;

    @ApiProperty({
        name: 'sort_by',
        enum: SortOption,
        example: SortOption.CREATED_AT,
        required: false
    })
    @IsEnum(SortOption)
    @IsOptional()
    @Expose({ name: 'sort_by' })
    sortBy?: SortOption;

    @ApiProperty({
        enum: OrderOption,
        example: OrderOption.DESC,
        required: false
    })
    @IsEnum(OrderOption)
    @IsOptional()
    order?: OrderOption;
}
