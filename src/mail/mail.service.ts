import { Injectable, Logger } from '@nestjs/common';

import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(private readonly mailerService: MailerService) {}

    async sendEmail({
        subject,
        to,
        template,
        context
    }: {
        subject: string;
        to: string;
        template: string;
        context: ISendMailOptions['context'];
    }) {
        try {
            this.logger.debug(`Sending email to ${to}`);

            await this.mailerService.sendMail({
                subject,
                to,
                template,
                context
            });

            this.logger.debug(`Email was successfully sent to ${to}`);
        } catch (error) {
            this.logger.log(`Error sending email: ${error}`);
        }
    }

    async sendVerificationCode({
        to,
        code
    }: {
        to: string;
        code: string
    }) {
        await this.sendEmail({
            subject: 'Подтверждение почты',
            to,
            template: 'email-verification',
            context: {
                code
            }
        });
    }
}
