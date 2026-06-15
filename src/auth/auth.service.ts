import { compareSync } from 'bcrypt';
import { randomUUID } from 'crypto';

import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
    NotFoundException,
    Logger
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { CodeService } from '@code/code.service';
import { MailService } from '@mail/mail.service';
import { Role, User } from '@prisma-client';
import { PrismaService } from '@prisma/prisma.service';
import { UserService } from '@user/user.service';

import { LoginRequestDto } from './dto/login-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
import { InviteTokenService } from '@invite-token/invite-token.service';
import { VerifyRecoveryDto } from './dto/verify-recovery.dto';
import { RecoveryPasswordDto } from './dto/recovery-password.dto';
import { ChangePasswordRequestDto } from './dto/change-password-request.dto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly prismaService: PrismaService,
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly codeService: CodeService,
        private readonly mailService: MailService,
        private readonly inviteTokenService: InviteTokenService
    ) {}

    private async getRefreshToken(userId: number, userAgent: string) {
        const existingToken = await this.prismaService.token.findFirst({
            where: {
                userId,
                userAgent
            }
        });

        const token = randomUUID();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 14);

        return this.prismaService.token.upsert({
            where: {
                token: existingToken ? existingToken.token : ''
            },
            update: {
                token,
                expiryDate
            },
            create: {
                token,
                expiryDate,
                userId,
                userAgent
            }
        });
    }

    private async generateTokens(
        user: User & { roles: Role[] },
        userAgent: string
    ) {
        const roles = user.roles.map(r => r.name);

        const accessToken = this.jwtService.sign({
            id: user.id,
            email: user.email,
            roles
        });

        const refreshToken = await this.getRefreshToken(user.id, userAgent);

        return {
            accessToken,
            refreshToken
        };
    }

    // TODO: transaction
    async register(dto: RegisterRequestDto, userAgent: string) {
        const existingUser = await this.userService.getByEmail(dto.email);

        if (existingUser) {
            throw new BadRequestException(
                'Пользователь с таким email уже зарегистрирован'
            );
        }

        let inviterId: number;

        if (dto.inviteToken != undefined) {
            const inviteToken = await this.inviteTokenService.getByToken(
                dto.inviteToken
            );

            if (!inviteToken) {
                throw new NotFoundException(
                    'Ссылка для приглашения недействительна'
                );
            }

            inviterId = inviteToken.creatorId;
        }

        const user = await this.userService.create(dto, inviterId);

        const tokens = await this.generateTokens(user, userAgent);

        const code = await this.codeService.create(user.id);

        // TODO: отправлять задачу в bullmq
        this.mailService.sendVerificationCode({
            to: dto.email,
            code
        });

        return { user: this.userService.createDto(user), tokens };
    }

    async login(dto: LoginRequestDto, userAgent: string) {
        const existingUser = await this.userService.getByEmail(dto.email);

        if (
            !existingUser ||
            !compareSync(dto.password, existingUser.password)
        ) {
            throw new BadRequestException(
                'Неверное имя пользователя или пароль'
            );
        }

        const tokens = await this.generateTokens(existingUser, userAgent);

        return { user: this.userService.createDto(existingUser), tokens };
    }

    async refresh(token: string, userAgent: string) {
        if (!token) {
            throw new UnauthorizedException();
        }

        const tokenData = await this.prismaService.token.findFirst({
            where: { token }
        });

        if (!tokenData || new Date(tokenData.expiryDate) < new Date()) {
            throw new UnauthorizedException();
        }

        const user = await this.userService.getById(tokenData.userId);

        return this.generateTokens(user, userAgent);
    }

    async deleteRefreshToken(token: string) {
        if (!token) {
            throw new UnauthorizedException();
        }

        return this.prismaService.token.deleteMany({
            where: {
                token
            }
        });
    }

    async resendVerificationCode(userId: number) {
        const { isVerified, email } = await this.userService.getById(userId);

        if (isVerified) {
            throw new BadRequestException('Ваш аккаунт уже верифицирован');
        }

        const code = await this.codeService.create(userId);

        this.mailService.sendVerificationCode({
            to: email,
            code
        });
    }

    async verify(code: string, userId: number) {
        const { isVerified } = await this.userService.getById(userId);

        if (isVerified) {
            throw new BadRequestException('Ваш аккаунт уже верифицирован');
        }

        await this.codeService.validateCode(code, userId);

        await this.userService.verify(userId);
    }

    async sendRecoveryCode(email: string): Promise<void> {
        const existingUser = await this.userService.getByEmail(email);

        if (!existingUser) {
            this.logger.warn(
                `Recovery code requested for non-existent email: ${email}`
            );
            return;
        }

        const code = await this.codeService.create(existingUser.id);

        // TODO: отправлять задачу в bullmq
        this.mailService.sendPasswordRecoveryCode({
            to: existingUser.email,
            code
        });
    }

    async verifyRecoveryCode({ email, code }: VerifyRecoveryDto) {
        const existingUser = await this.userService.getByEmail(email);

        if (!existingUser) {
            throw new BadRequestException('Код недействителен или истек');
        }

        await this.codeService.validateCode(code, existingUser.id);

        const newCode = await this.codeService.create(existingUser.id);

        return { code: newCode };
    }

    async recoveryPassword({ email, code, password }: RecoveryPasswordDto) {
        const existingUser = await this.userService.getByEmail(email);

        if (!existingUser) {
            throw new BadRequestException('Код недействителен или истек');
        }

        await this.codeService.validateCode(code, existingUser.id);

        await this.userService.updatePassword(existingUser.id, password);
    }

    async changePassword(
        userId: number,
        { oldPassword, newPassword }: ChangePasswordRequestDto
    ) {
        const existingUser = await this.userService.getById(userId);

        if (!compareSync(oldPassword, existingUser.password)) {
            throw new BadRequestException('Неверный старый пароль');
        }

        return await this.userService.updatePassword(
            existingUser.id,
            newPassword
        );
    }
}
