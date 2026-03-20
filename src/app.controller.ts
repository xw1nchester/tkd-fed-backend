import { Public } from '@auth/decorators';
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

@Controller()
export class AppController {
    @Public()
    @Get('health')
    @HttpCode(HttpStatus.OK)
    healthCheck() {
        return;
    }
}
