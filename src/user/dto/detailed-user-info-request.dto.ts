import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '@prisma-client';
import { Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsEnum,
    IsNumber,
    IsOptional,
    ValidateNested
} from 'class-validator';

class DocumentRequestDto {
    @ApiProperty({
        enum: DocumentType,
        example: DocumentType.PASSPORT
    })
    @IsEnum(DocumentType)
    type: DocumentType;

    @ApiProperty({ example: 1 })
    @IsNumber()
    @Transform(({ value }) => Number(value))
    fileId: number;
}

export class DetailedUserInfoRequestDto {
    @ApiProperty({ example: 1 })
    @IsNumber()
    @Transform(({ value }) => Number(value))
    @IsOptional()
    beltId: number;

    @ApiProperty({ example: 1 })
    @IsNumber()
    @Transform(({ value }) => Number(value))
    @IsOptional()
    sportRankId: number;

    @ApiProperty({ type: [DocumentRequestDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DocumentRequestDto)
    documents: DocumentRequestDto[];
}
