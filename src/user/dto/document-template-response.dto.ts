import { ApiProperty } from '@nestjs/swagger';

import { FileDto } from '@file/dto/file-response.dto';

export class DocumentTemplateResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: true })
    isOwner: boolean;

    @ApiProperty({ example: true })
    visibleToInvitedTrainers: boolean;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty({ type: FileDto })
    file: FileDto;
}

export class DocumentTemplateWrapperResponseDto {
    @ApiProperty({ type: DocumentTemplateResponseDto })
    documentTemplate: DocumentTemplateResponseDto;
}

export class DocumentTemplatesWrapperResponseDto {
    @ApiProperty({ type: [DocumentTemplateResponseDto] })
    documentTemplates: DocumentTemplateResponseDto[];
}
