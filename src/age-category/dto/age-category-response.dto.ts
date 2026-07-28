import { ApiProperty } from '@nestjs/swagger';

class AgeCategoryResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Молодежка' })
    name: string;

    @ApiProperty({ example: 16 })
    minAge: number;

    @ApiProperty({ example: 20 })
    maxAge: number | null;
}

export class AgeCategoryWrapperResponseDto {
    @ApiProperty({ type: AgeCategoryResponseDto })
    ageCategory: AgeCategoryResponseDto;
}

export class AgeCategoriesResponseDto {
    @ApiProperty({ type: AgeCategoryResponseDto, isArray: true })
    ageCategories: AgeCategoryResponseDto[];
}
