import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private readonly logger = new Logger('HTTP');

    use(req: Request, res: Response, next: NextFunction) {
        const { method, originalUrl } = req;
        // TODO: настроить trust proxy и брать req.ip
        const ip = req.headers['x-forwarded-for'];
        const startTime = Date.now();

        res.on('finish', () => {
            const { statusCode } = res;
            const duration = Date.now() - startTime;

            const message = `${method} ${originalUrl} ${statusCode} ${duration}ms - IP: ${ip}`;

            if (statusCode >= 500) {
                this.logger.error(message);
            } else if (statusCode >= 400) {
                this.logger.warn(message);
            } else {
                this.logger.log(message);
            }
        });

        next();
    }
}
