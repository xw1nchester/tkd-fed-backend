import * as cookieParser from 'cookie-parser';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);

    app.useGlobalPipes(new ValidationPipe());

    app.enableCors({
        credentials: true,
        origin: configService.get('ALLOWED_ORIGINS').split(',')
    });

    app.use(cookieParser());

    app.setGlobalPrefix('api');

    const swaggerConfig = new DocumentBuilder()
        .setTitle('Taekwondo Federation API documentation')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api-docs', app, document);

    await app.listen(configService.get('PORT'));
}
bootstrap();
