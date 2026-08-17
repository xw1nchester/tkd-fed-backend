import { Gender } from '@prisma-client';
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

    @ApiProperty({
        enum: Gender,
        example: Gender.MALE,
        required: false
    })
    @IsEnum(Gender)
    @IsOptional()
    gender?: Gender;

    @ApiProperty({ name: 'age_category_id', example: 1, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    @Expose({ name: 'age_category_id' })
    ageCategoryId?: number;
}
