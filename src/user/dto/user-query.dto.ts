import { Expose, Type } from 'class-transformer';
import {
    IsEnum,
    IsInt,
    IsOptional,
    IsPositive,
    IsString
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { PaginationQueryDto } from '@shared/dto/pagination-query.dto';

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

    @ApiProperty({ name: 'min_age', example: 16, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    @Expose({ name: 'min_age' })
    minAge?: number;

    @ApiProperty({ name: 'max_age', example: 20, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    @Expose({ name: 'max_age' })
    maxAge?: number;
}
