import { memoryStorage } from 'multer';

import {
    BadRequestException,
    Controller,
    Post,
    UploadedFiles,
    UseInterceptors
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOkResponse
} from '@nestjs/swagger';

import { CurrentUser } from '@auth/decorators';
import { JwtPayload } from '@auth/interfaces';

import { FilesResponseDto } from './dto/file-response.dto';
import { FileService } from './file.service';

@Controller('file')
export class FileController {
    constructor(
        private readonly configService: ConfigService,
        private readonly fileService: FileService
    ) {}

    @UseInterceptors(
        FilesInterceptor('files', 10, {
            storage: memoryStorage(),
            limits: {
                fileSize: 10 * 1024 * 1024 // 10 MB на один файл
            }
        })
    )
    @Post('upload')
    @ApiBearerAuth()
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary'
                    }
                }
            }
        }
    })
    @ApiOkResponse({ type: FilesResponseDto })
    async upload(
        @CurrentUser() user: JwtPayload,
        @UploadedFiles() files: Express.Multer.File[]
    ) {
        if (!files || files.length == 0) {
            throw new BadRequestException(
                'Необходимо загрузить хотя бы один файл'
            );
        }

        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        const maxTotalSize = 30 * 1024 * 1024;

        if (totalSize > maxTotalSize) {
            throw new BadRequestException('Превышен общий объем файлов');
        }

        return await this.fileService.save(user.id, files);
    }
}
