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

export enum FileVisibility {
    PUBLIC = 'public',
    PRIVATE = 'private'
}

@Injectable()
export class S3Service implements OnModuleInit {
    private logger = new Logger(S3Service.name);
    private s3: S3Client;
    private publicS3: S3Client;

    constructor(private configService: ConfigService) {}

    private get bucket() {
        return this.configService.getOrThrow<string>('S3_BUCKET');
    }

    private async createBucketIfNotExists() {
        try {
            await this.s3.send(
                new CreateBucketCommand({
                    Bucket: this.bucket
                })
            );
            this.logger.debug(
                `Bucket '${this.bucket}' created or already exists.`
            );
        } catch (err) {
            if (
                err?.name === 'BucketAlreadyOwnedByYou' ||
                err?.name === 'BucketAlreadyExists'
            ) {
                this.logger.debug(`Bucket '${this.bucket}' already exists.`);
            } else {
                this.logger.error('Error creating bucket:', err);
                throw err;
            }
        }
    }

    private async makePublicPrefixReadable() {
        const policy = {
            Version: '2012-10-17',
            Statement: [
                {
                    Sid: 'PublicReadOnlyPublicPrefix',
                    Effect: 'Allow',
                    Principal: '*',
                    Action: ['s3:GetObject'],
                    Resource: [`arn:aws:s3:::${this.bucket}/public/*`]
                }
            ]
        };

        try {
            await this.s3.send(
                new PutBucketPolicyCommand({
                    Bucket: this.bucket,
                    Policy: JSON.stringify(policy)
                })
            );
            this.logger.debug(
                `Bucket '${this.bucket}' public prefix is now readable.`
            );
        } catch (err) {
            this.logger.error('Error setting bucket policy:', err);
            throw err;
        }
    }

    async onModuleInit() {
        const credentials = {
            accessKeyId: this.configService.getOrThrow<string>('S3_ACCESS_KEY'),
            secretAccessKey: this.configService.getOrThrow<string>('S3_SECRET_KEY')
        };

        this.s3 = new S3Client({
            region: 'us-east-1',
            endpoint: this.configService.getOrThrow<string>('S3_URL'),
            credentials,
            forcePathStyle: true
        });

        this.publicS3 = new S3Client({
            region: 'us-east-1',
            endpoint: this.configService.getOrThrow<string>('S3_PUBLIC_URL'),
            credentials,
            forcePathStyle: true
        });

        await this.createBucketIfNotExists();
        await this.makePublicPrefixReadable();
    }

    getPublicUrl(key: string) {
        if (!key.startsWith(`${FileVisibility.PUBLIC}/`)) {
            throw new InternalServerErrorException('File is not public');
        }

        return `${this.configService.getOrThrow<string>('S3_PUBLIC_URL')}/${this.bucket}/${key}`;
    }

    async getSignedReadUrl(key: string, expiresInSeconds = 60 * 10) {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key
        });

        return getSignedUrl(this.publicS3, command, {
            expiresIn: expiresInSeconds
        });
    }

    async uploadFile(
        body: Buffer,
        contentType: string,
        visibility = FileVisibility.PRIVATE,
        extension = 'bin'
    ) {
        try {
            const key = `${visibility}/${randomUUID()}.${extension}`;

            await this.s3.send(
                new PutObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                    Body: body,
                    ContentType: contentType
                })
            );

            this.logger.debug(`File uploaded: ${key}`);

            return { key };
        } catch (err) {
            this.logger.error('Error uploading file:', err);
            throw new InternalServerErrorException('Failed to upload file');
        }
    }

    async deleteFile(key: string) {
        try {
            await this.s3.send(
                new DeleteObjectCommand({
                    Bucket: this.bucket,
                    Key: key
                })
            );

            this.logger.debug(`File deleted ${key}`);
        } catch (err) {
            
            this.logger.error('Error delete file:', err);
        }
    }
}
