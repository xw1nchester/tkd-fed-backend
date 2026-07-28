import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

import { Public } from '@auth/decorators';

@Controller()
export class AppController {
    @Public()
    @Get('health')
    @HttpCode(HttpStatus.OK)
    healthCheck() {
        return;
    }
}
