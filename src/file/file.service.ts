import { File, Prisma } from '@prisma-client';
import { extension } from 'mime-types';
import { extname } from 'path';

import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@prisma/prisma.service';

import { FileVisibility, S3Service } from '@s3/s3.service';

@Injectable()
export class FileService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly s3Service: S3Service
    ) {}

    createPublicDto(file: File) {
        if (!file) return null;

        return {
            id: file.id,
            url: this.s3Service.getPublicUrl(file.storageKey),
            type: file.mimeType,
            filename: file.filename,
            size: file.size,
            createdAt: file.createdAt
        };
    }

    async createPrivateDto(file: File, expiresInSeconds = 60 * 10) {
        if (!file) return null;

        return {
            id: file.id,
            url: await this.s3Service.getSignedReadUrl(
                file.storageKey,
                expiresInSeconds
            ),
            type: file.mimeType,
            filename: file.filename,
            size: file.size,
            createdAt: file.createdAt
        };
    }

    private async createUploadDto(file: File) {
        if (file.storageKey.startsWith(`${FileVisibility.PUBLIC}/`)) {
            return this.createPublicDto(file);
        }

        return await this.createPrivateDto(file);
    }

    private getFileExtension(file: Express.Multer.File) {
        const mimeExtension = extension(file.mimetype);

        if (mimeExtension) {
            return mimeExtension;
        }

        const originalExtension = extname(file.originalname)
            .replace('.', '')
            .toLowerCase();

        return originalExtension || 'bin';
    }

    // async save(userId: number, files: CreateFileDto[]) {
    //     const data = await this.prismaService.$transaction(
    //         files.map(file =>
    //             this.prismaService.file.create({
    //                 data: {
    //                     userId,
    //                     ...file
    //                 }
    //             })
    //         )
    //     );

    //     return { files: data.map(file => this.createDto(file)) };
    // }

    async save(
        userId: number,
        files: Express.Multer.File[],
        visibility = FileVisibility.PUBLIC
    ) {
        const uploadedFiles = await Promise.all(
            files.map(async file => {
                const uploaded = await this.s3Service.uploadFile(
                    file.buffer,
                    file.mimetype,
                    visibility,
                    this.getFileExtension(file)
                );

                return {
                    storageKey: uploaded.key,
                    mimeType: file.mimetype,
                    filename: file.originalname,
                    size: file.size
                };
            })
        );

        try {
            const data = await this.prismaService.$transaction(
                uploadedFiles.map(file =>
                    this.prismaService.file.create({
                        data: {
                            userId,
                            ...file
                        }
                    })
                )
            );

            return {
                files: await Promise.all(
                    data.map(file => this.createUploadDto(file))
                )
            };
        } catch (err) {
            await Promise.allSettled(
                uploadedFiles.map(file =>
                    this.s3Service.deleteFile(file.storageKey)
                )
            );

            throw err;
        }
    }

    async exists(ids: number | number[], userId?: number) {
        ids = [...new Set(Array.isArray(ids) ? ids : [ids])];

        const where: Prisma.FileWhereInput = { id: { in: ids } };

        if (userId != undefined) {
            where.userId = userId;
        }

        const count = await this.prismaService.file.count({
            where
        });

        return ids.length == count;
    }

    async delete(id: number, tx?: Prisma.TransactionClient) {
        const prismaService = tx ?? this.prismaService;

        const file = await prismaService.file.findFirst({
            where: { id }
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        await prismaService.file.delete({
            where: { id }
        });

        await this.s3Service.deleteFile(file.storageKey);
    }
}
