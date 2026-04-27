import { ApiProperty } from '@nestjs/swagger';
import { PaginationQueryDto } from '@shared/dto/pagination-query.dto';
import { IsOptional, IsString } from 'class-validator';

export class SearchQueryDto extends PaginationQueryDto {
    @ApiProperty({
        example: 'Баклажан',
        required: false
    })
    @IsString()
    @IsOptional()
    search: string;
}
