import { Response } from 'express';

import {
    Body,
    Controller,
    Get,
    HttpStatus,
    Post,
    Res,
    UseGuards
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Token } from '@prisma-client';

import { AuthService } from './auth.service';
import { Cookie, CurrentUser, UserAgent } from './decorators';
import { AuthRequestDto } from './dto/auth-request.dto';
import { JwtPayload } from './interfaces';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CodeRequestDto } from './dto/code-request.dto';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { AuthResponseDto, TokenResponseDto } from './dto/auth-response.dto';

const REFRESH_TOKEN = 'refresh-token';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly configService: ConfigService,
        private readonly authService: AuthService
    ) {}

    private setRefreshTokenToCookie(res: Response, refreshToken: Token) {
        res.cookie(REFRESH_TOKEN, refreshToken.token, {
            httpOnly: true,
            sameSite: 'lax',
            expires: new Date(refreshToken.expiryDate),
            secure:
                this.configService.get('NODE_ENV', 'development') ===
                'production',
            path: '/'
        });
    }

    @Post('register')
    @ApiCreatedResponse({ type: AuthResponseDto })
    async register(
        @Body() dto: AuthRequestDto,
        @UserAgent() userAgent: string,
        @Res() res: Response
    ) {
        const { user, tokens } = await this.authService.register(
            dto,
            userAgent
        );

        this.setRefreshTokenToCookie(res, tokens.refreshToken);

        res.json({ user, accessToken: tokens.accessToken });
    }

    @Post('login')
    @ApiCreatedResponse({ type: AuthResponseDto })
    async login(
        @Body() dto: AuthRequestDto,
        @UserAgent() userAgent: string,
        @Res() res: Response
    ) {
        const { user, tokens } = await this.authService.login(dto, userAgent);

        this.setRefreshTokenToCookie(res, tokens.refreshToken);

        res.json({ user, accessToken: tokens.accessToken });
    }

    @Get('refresh')
    @ApiOkResponse({ type: TokenResponseDto })
    async refresh(
        @Cookie(REFRESH_TOKEN) refreshToken: string,
        @UserAgent() agent: string,
        @Res() res: Response
    ) {
        const tokens = await this.authService.refresh(refreshToken, agent);

        this.setRefreshTokenToCookie(res, tokens.refreshToken);

        res.json({ accessToken: tokens.accessToken });
    }

    @Get('logout')
    async logout(
        @Cookie(REFRESH_TOKEN) refreshToken: string,
        @Res() res: Response
    ) {
        await this.authService.deleteRefreshToken(refreshToken);

        res.clearCookie(REFRESH_TOKEN);

        res.sendStatus(HttpStatus.OK);
    }

    @UseGuards(JwtAuthGuard)
    @Get('resend-verification')
    async resendVerificationCode(@CurrentUser() user: JwtPayload) {
        await this.authService.resendVerificationCode(user.id);

        return HttpStatus.OK;
    }

    @UseGuards(JwtAuthGuard)
    @Post('verify')
    async verify(
        @Body() { code }: CodeRequestDto,
        @CurrentUser() user: JwtPayload
    ) {
        await this.authService.verify(code, user.id);

        return HttpStatus.OK;
    }
}
