import { IsEnum, IsOptional } from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';
import { FileVisibility } from '@prisma-client';

export class FileUploadRequestDto {
    @ApiPropertyOptional({
        enum: FileVisibility,
        default: FileVisibility.PUBLIC
    })
    @IsEnum(FileVisibility)
    @IsOptional()
    visibility?: FileVisibility = FileVisibility.PUBLIC;
}
