import { randomUUID } from 'crypto';
import {
    BadRequestException,
    Controller,
    Post,
    UploadedFiles,
    UseInterceptors
} from '@nestjs/common';
import { FileService } from './file.service';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOkResponse
} from '@nestjs/swagger';
import { FilesResponseDto } from './dto/file-response.dto';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '@auth/interfaces';
import { CurrentUser } from '@auth/decorators';

@Controller('file')
export class FileController {
    constructor(
        private readonly configService: ConfigService,
        private readonly fileService: FileService
    ) {}

    @UseInterceptors(
        FilesInterceptor('files', 10, {
            storage: diskStorage({
                destination: 'uploads',
                filename: (req, file, cb) => {
                    const ext = extname(file.originalname);
                    cb(null, randomUUID() + ext);
                }
            })
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

        return await this.fileService.save(
            user.id,
            files.map(({ filename, mimetype, originalname }) => ({
                storageKey: filename,
                mimeType: mimetype,
                filename: originalname
            }))
        );
    }
}
