import { File, PendingFileDeletion, Prisma } from '@prisma-client';
import { extension } from 'mime-types';
import { extname } from 'path';

import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@prisma/prisma.service';

import { FileVisibility, S3Service } from '@s3/s3.service';
import { Cron, CronExpression } from '@nestjs/schedule';

interface RawPendingFileDeletion {
    id: number;
    storage_key: string;
    created_at: string;
}

@Injectable()
export class FileService {
    private readonly logger = new Logger(FileService.name);

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

    async save(
        userId: number,
        files: Express.Multer.File[],
        visibility = FileVisibility.PUBLIC
    ) {
        const uploadResults = await Promise.allSettled(
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

        const uploadedFiles = uploadResults
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);

        const failedUpload = uploadResults.find(
            result => result.status === 'rejected'
        );

        if (failedUpload) {
            await Promise.allSettled(
                uploadedFiles.map(file =>
                    this.s3Service.deleteFile(file.storageKey)
                )
            );

            throw failedUpload.reason;
        }

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

        await prismaService.pendingFileDeletion.create({
            data: { storageKey: file.storageKey }
        });

        await prismaService.file.delete({
            where: { id }
        });
    }

    @Cron(CronExpression.EVERY_HOUR)
    async processDeletedFiles() {
        const startedAt = Date.now();

        const records = await this.prismaService.$transaction(async tx => {
            const rows = await tx.$queryRaw<RawPendingFileDeletion[]>`
            SELECT *
            FROM "pending_file_deletions"
            WHERE "locked_at" IS NULL
               OR "locked_at" < NOW() - INTERVAL '1 hour'
            ORDER BY "created_at"
            LIMIT 100
            FOR UPDATE SKIP LOCKED
        `;

            if (rows.length) {
                await tx.pendingFileDeletion.updateMany({
                    where: {
                        id: {
                            in: rows.map(row => row.id)
                        }
                    },
                    data: {
                        lockedAt: new Date()
                    }
                });
            }

            return rows;
        });

        if (!records.length) {
            this.logger.debug('File deletion outbox: no pending files');
            return;
        }

        let deleted = 0;
        let failed = 0;

        for (const record of records) {
            try {
                await this.s3Service.deleteFile(record.storage_key);

                await this.prismaService.pendingFileDeletion.delete({
                    where: { id: record.id }
                });

                deleted++;
            } catch (err) {
                failed++;

                await this.prismaService.pendingFileDeletion.update({
                    where: { id: record.id },
                    data: {
                        lockedAt: null,
                        attempts: {
                            increment: 1
                        },
                        lastError:
                            err instanceof Error ? err.message : 'Unknown error'
                    }
                });
            }
        }

        this.logger.log(
            `File deletion outbox finished: ${deleted} deleted, ${failed} failed, ${Date.now() - startedAt}ms`
        );
    }
}
