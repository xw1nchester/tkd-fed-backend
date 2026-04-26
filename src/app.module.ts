import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CodeModule } from './code/code.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UploadModule } from './upload/upload.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        ServeStaticModule.forRoot({
            serveRoot: '/static',
            rootPath: join(__dirname, '..', '..', 'uploads')
        }),
        AuthModule,
        UserModule,
        MailModule,
        CodeModule,
        UploadModule
    ],
    controllers: [AppController],
    providers: [
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard
        }
    ]
})
export class AppModule {}
