import { ApiProperty } from "@nestjs/swagger";

export class FileDto {
    @ApiProperty({
        example: 'http://localhost:8080/static/64c43ba9-b062-4875-a989-291948999b4e.jpeg'
    })
    url: string;

    @ApiProperty({
        example: '6492322426.jpeg'
    })
    name: string;

    @ApiProperty({
        example: 'image/jpeg'
    })
    type: string;

    @ApiProperty({
        example: 245760
    })
    size: number;
}

export class FilesResponseDto {
    @ApiProperty({ type: [FileDto] })
    files: FileDto[];
}