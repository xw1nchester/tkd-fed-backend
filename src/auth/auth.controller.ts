import { Response } from 'express';

import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Patch,
    Post,
    Res
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Token } from '@prisma-client';

import { AuthService } from './auth.service';
import { Cookie, CurrentUser, Public, UserAgent } from './decorators';
import { LoginRequestDto } from './dto/login-request.dto';
import { JwtPayload } from './interfaces';
import { CodeDto } from './dto/code.dto';
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiOkResponse
} from '@nestjs/swagger';
import { AuthResponseDto, TokenResponseDto } from './dto/auth-response.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
import { RecoveryRequestDto } from './dto/recovery-request.dto';
import { VerifyRecoveryDto } from './dto/verify-recovery.dto';
import { RecoveryPasswordDto } from './dto/recovery-password.dto';
import { ChangePasswordRequestDto } from './dto/change-password-request.dto';

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

    @Public()
    @Post('register')
    @ApiCreatedResponse({ type: AuthResponseDto })
    async register(
        @Body() dto: RegisterRequestDto,
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

    @Public()
    @Post('login')
    @ApiCreatedResponse({ type: AuthResponseDto })
    async login(
        @Body() dto: LoginRequestDto,
        @UserAgent() userAgent: string,
        @Res() res: Response
    ) {
        const { user, tokens } = await this.authService.login(dto, userAgent);

        this.setRefreshTokenToCookie(res, tokens.refreshToken);

        res.json({ user, accessToken: tokens.accessToken });
    }

    @Public()
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

    @Public()
    @Get('logout')
    async logout(
        @Cookie(REFRESH_TOKEN) refreshToken: string,
        @Res() res: Response
    ) {
        await this.authService.deleteRefreshToken(refreshToken);

        res.clearCookie(REFRESH_TOKEN);

        res.sendStatus(HttpStatus.OK);
    }

    @Get('resend-verification')
    @ApiBearerAuth()
    async resendVerificationCode(@CurrentUser() user: JwtPayload) {
        await this.authService.resendVerificationCode(user.id);

        return HttpStatus.OK;
    }

    @Post('verify')
    @ApiBearerAuth()
    async verify(@Body() { code }: CodeDto, @CurrentUser() user: JwtPayload) {
        await this.authService.verify(code, user.id);

        return HttpStatus.OK;
    }

    @Public()
    @Post('send-recovery')
    @HttpCode(HttpStatus.OK)
    async sendRecoveryCode(@Body() { email }: RecoveryRequestDto) {
        await this.authService.sendRecoveryCode(email);
    }

    @Public()
    @Post('verify-recovery')
    @ApiOkResponse({ type: CodeDto })
    async verifyRecoveryCode(@Body() dto: VerifyRecoveryDto) {
        return await this.authService.verifyRecoveryCode(dto);
    }

    @Public()
    @Post('recovery-password')
    @HttpCode(HttpStatus.OK)
    async recoveryPassword(@Body() dto: RecoveryPasswordDto) {
        await this.authService.recoveryPassword(dto);
    }

    @Patch('change-password')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    async changePassword(
        @CurrentUser() user: JwtPayload,
        @Body() dto: ChangePasswordRequestDto
    ) {
        await this.authService.changePassword(user.id, dto);
    }
}
