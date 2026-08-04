import {
    CreateBucketCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    PutBucketPolicyCommand,
    PutObjectCommand,
    S3Client
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
    Injectable,
    InternalServerErrorException,
    Logger,
    OnModuleInit
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class S3Service implements OnModuleInit {
    private logger = new Logger(S3Service.name);
    private s3: S3Client;

    constructor(private configService: ConfigService) {}

    private async createBucketIfNotExists() {
        try {
            await this.s3.send(
                new CreateBucketCommand({
                    Bucket: this.configService.get('S3_BUCKET')
                })
            );
            this.logger.debug(
                `Bucket '${this.configService.get('S3_BUCKET')}' created or already exists.`
            );
        } catch (err) {
            if (
                err?.name === 'BucketAlreadyOwnedByYou' ||
                err?.name === 'BucketAlreadyExists'
            ) {
                this.logger.debug(
                    `Bucket '${this.configService.get('S3_BUCKET')}' already exists.`
                );
            } else {
                this.logger.error('Error creating bucket:', err);
                throw err;
            }
        }
    }

    private async makeBucketPublic() {
        const policy = {
            Version: '2012-10-17',
            Statement: [
                {
                    Sid: 'PublicRead',
                    Effect: 'Allow',
                    Principal: '*',
                    Action: ['s3:GetObject'],
                    Resource: [
                        `arn:aws:s3:::${this.configService.get('S3_BUCKET')}/*`
                    ]
                }
            ]
        };

        try {
            await this.s3.send(
                new PutBucketPolicyCommand({
                    Bucket: this.configService.get('S3_BUCKET'),
                    Policy: JSON.stringify(policy)
                })
            );
            this.logger.debug(
                `Bucket '${this.configService.get('S3_BUCKET')}' is now public.`
            );
        } catch (err) {
            this.logger.error('Error setting bucket policy:', err);
            throw err;
        }
    }

    async onModuleInit() {
        this.s3 = new S3Client({
            region: 'us-east-1',
            endpoint: this.configService.get('S3_URL'),
            credentials: {
                accessKeyId: this.configService.get('S3_ACCESS_KEY'),
                secretAccessKey: this.configService.get('S3_SECRET_KEY')
            },
            forcePathStyle: true
        });
        await this.createBucketIfNotExists();
        await this.makeBucketPublic();
    }

    async getSignedReadUrl(key: string, expiresInSeconds = 60 * 10) {
        const command = new GetObjectCommand({
            Bucket: this.configService.get('S3_BUCKET'),
            Key: key
        });

        return getSignedUrl(this.s3, command, {
            expiresIn: expiresInSeconds
        });
    }

    getPublicUrl(key: string) {
        return `${this.configService.get('S3_PUBLIC_URL')}/${this.configService.get('S3_BUCKET')}/${key}`;
    }

    async uploadFile(body: Buffer, contentType: string) {
        try {
            // TODO: довести до ума (для image/svg+xml получится странное расширение)
            const ext = contentType.split('/')[1];
            const key = `${randomUUID()}.${ext}`;

            await this.s3.send(
                new PutObjectCommand({
                    Bucket: this.configService.get('S3_BUCKET'),
                    Key: key,
                    Body: body,
                    ContentType: contentType
                })
            );

            // возможно не стоит давать публичный url и логировать после загрузки чувствительного файла
            const url = this.getPublicUrl(key);

            this.logger.debug(`File uploaded.: ${url}`);

            return { key, url };
        } catch (err) {
            this.logger.error('Error uploading file:', err);
            throw new InternalServerErrorException('Failed to upload file');
        }
    }

    async deleteFile(key: string) {
        try {
            await this.s3.send(
                new DeleteObjectCommand({
                    Bucket: this.configService.get('S3_BUCKET'),
                    Key: key
                })
            );
            this.logger.debug(`File deleted ${key}`);
        } catch (err) {
            this.logger.error('Error delete file:', err);
            throw new InternalServerErrorException('Can not delete file');
        }
    }
}
