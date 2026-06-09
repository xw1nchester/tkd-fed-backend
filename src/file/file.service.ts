import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateFileDto } from './dto/create-file.dto';
import { File } from '@prisma-client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileService {
    constructor(
        private readonly configService: ConfigService,
        private readonly prismaService: PrismaService
    ) {}

    createDto(file: File) {
        const staticUrl = this.configService.get('STATIC_URL');

        return {
            id: file.id,
            key: file.storageKey,
            url: `${staticUrl}/${file.storageKey}`,
            type: file.mimeType,
            filename: file.filename,
            createdAt: file.createdAt
        };
    }

    // TODO: minio
    async save(userId: number, files: CreateFileDto[]) {
        const data = await this.prismaService.$transaction(
            files.map(file =>
                this.prismaService.file.create({
                    data: {
                        userId,
                        ...file
                    }
                })
            )
        );

        return { files: data.map(file => this.createDto(file)) };
    }
}
