import { execSync } from 'child_process';

import { Gender } from '@prisma-client';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { MailerService } from '@nestjs-modules/mailer';

import { AppModule } from '../src/app.module';
import { MailService } from '../src/mail/mail.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { S3Service } from '../src/s3/s3.service';

describe('AuthController (e2e)', () => {
    let app: INestApplication;
    let postgresContainer: StartedTestContainer;
    let prismaService: PrismaService;

    const password = 'StrongPass123!';
    const newPassword = 'NewStrongPass123!';
    const runId = Date.now();
    const emailPrefix = `auth-e2e-${runId}`;
    let sequence = 0;

    const mailServiceMock = {
        sendVerificationCode: jest.fn(),
        sendPasswordRecoveryCode: jest.fn()
    };

    const createEmail = (name: string) =>
        `${emailPrefix}-${name}-${sequence++}@example.com`;

    const createRegisterPayload = (
        email: string,
        overrides: Record<string, unknown> = {}
    ) => ({
        email,
        lastName: 'Ivanov',
        firstName: 'Ivan',
        middleName: 'Ivanovich',
        birthDate: '2000-01-01',
        gender: Gender.MALE,
        password,
        ...overrides
    });

    const getSetCookies = (response: request.Response): string[] => {
        const cookies = response.headers['set-cookie'];

        if (!cookies) {
            return [];
        }

        return Array.isArray(cookies) ? cookies : [cookies];
    };

    const getRefreshCookie = (response: request.Response) => {
        const refreshCookie = getSetCookies(response).find(cookie =>
            cookie.startsWith('refresh-token=')
        );

        expect(refreshCookie).toBeDefined();

        return refreshCookie.split(';')[0];
    };

    const getRefreshTokenValue = (cookie: string) =>
        cookie.replace(/^refresh-token=/, '');

    const expectAuthResponse = (
        response: request.Response,
        payload: ReturnType<typeof createRegisterPayload>
    ) => {
        expect(response.body).toEqual(
            expect.objectContaining({
                accessToken: expect.any(String),
                user: expect.objectContaining({
                    id: expect.any(Number),
                    email: payload.email,
                    firstName: payload.firstName,
                    lastName: payload.lastName,
                    middleName: payload.middleName,
                    birthDate: expect.any(String),
                    gender: payload.gender,
                    isVerified: expect.any(Boolean)
                })
            })
        );
        expect(response.body.user).not.toHaveProperty('password');
    };

    const registerUser = async (
        name: string,
        overrides: Record<string, unknown> = {},
        userAgent = `auth-e2e-register-${name}`
    ) => {
        const payload = createRegisterPayload(createEmail(name), overrides);
        const response = await request(app.getHttpServer())
            .post('/api/auth/register')
            .set('User-Agent', userAgent)
            .send(payload)
            .expect(201);

        expectAuthResponse(response, payload);

        return {
            payload,
            response,
            accessToken: response.body.accessToken as string,
            refreshCookie: getRefreshCookie(response),
            userId: response.body.user.id as number
        };
    };

    const loginUser = (
        email: string,
        loginPassword = password,
        userAgent = 'auth-e2e-login'
    ) =>
        request(app.getHttpServer())
            .post('/api/auth/login')
            .set('User-Agent', userAgent)
            .send({
                email,
                password: loginPassword
            });

    const getUserCode = async (userId: number) => {
        const code = await prismaService.code.findFirstOrThrow({
            where: { userId }
        });

        return code;
    };

    const makeUserCodeRetryable = async (userId: number) => {
        await prismaService.code.updateMany({
            where: { userId },
            data: {
                retryDate: new Date(Date.now() - 60_000)
            }
        });
    };

    beforeAll(async () => {
        postgresContainer = await new GenericContainer('postgres:16-alpine')
            .withEnvironment({
                POSTGRES_DB: 'tkd_test',
                POSTGRES_USER: 'postgres',
                POSTGRES_PASSWORD: 'postgres'
            })
            .withExposedPorts(5432)
            .withWaitStrategy(
                Wait.forLogMessage(
                    'database system is ready to accept connections'
                )
            )
            .start();

        process.env.DATABASE_URL = `postgresql://postgres:postgres@${postgresContainer.getHost()}:${postgresContainer.getMappedPort(5432)}/tkd_test?schema=public`;
        process.env.JWT_SECRET ??= 'test-jwt-secret';
        process.env.ALLOWED_ORIGINS ??= 'http://localhost';

        execSync('npx prisma migrate deploy', {
            env: {
                ...process.env
            }
        });

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule]
        })
            .overrideProvider(MailerService)
            .useValue({
                sendMail: jest.fn()
            })
            .overrideProvider(MailService)
            .useValue(mailServiceMock)
            .overrideProvider(S3Service)
            .useValue({
                getSignedReadUrl: jest.fn(),
                getPublicUrl: jest.fn(),
                uploadFile: jest.fn(),
                deleteFile: jest.fn()
            })
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true
            })
        );
        app.use(cookieParser());
        app.setGlobalPrefix('api');

        prismaService = app.get(PrismaService);

        await app.init();
    }, 120000);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await app?.close();
        await prismaService?.$disconnect();
        await postgresContainer?.stop();
    });

    describe('POST /api/auth/register', () => {
        it('registers a new user', async () => {
            await registerUser('register-success');
        });

        it('returns 400 when registering with an existing email', async () => {
            const payload = createRegisterPayload(
                createEmail('register-duplicate')
            );

            const firstResponse = await request(app.getHttpServer())
                .post('/api/auth/register')
                .set('User-Agent', 'auth-register-e2e-duplicate-setup')
                .send(payload)
                .expect(201);

            expectAuthResponse(firstResponse, payload);

            await request(app.getHttpServer())
                .post('/api/auth/register')
                .set('User-Agent', 'auth-register-e2e-duplicate')
                .send(payload)
                .expect(400);
        });

        it('registers with a valid invite token', async () => {
            const inviter = await prismaService.user.create({
                data: {
                    email: createEmail('register-inviter'),
                    password
                }
            });
            const inviteToken = await prismaService.inviteToken.create({
                data: {
                    token: `${emailPrefix}-valid-invite-${sequence++}`,
                    creatorId: inviter.id
                }
            });
            const payload = createRegisterPayload(
                createEmail('register-invited'),
                {
                    inviteToken: inviteToken.token
                }
            );

            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .set('User-Agent', 'auth-register-e2e-invited')
                .send(payload)
                .expect(201);

            expectAuthResponse(response, payload);
        });

        it('returns 404 when invite token does not exist', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register')
                .set('User-Agent', 'auth-register-e2e-missing-invite')
                .send(
                    createRegisterPayload(
                        createEmail('register-missing-invite'),
                        {
                            inviteToken: `${emailPrefix}-missing-invite-${sequence++}`
                        }
                    )
                )
                .expect(404);
        });
    });

    describe('POST /api/auth/login', () => {
        it('logs in with differently cased email', async () => {
            const { payload } = await registerUser('login-email-case');
            const response = await loginUser(
                payload.email.toUpperCase(),
                password,
                'auth-e2e-login-email-case'
            ).expect(201);

            expectAuthResponse(response, payload);
            expect(getRefreshCookie(response)).toEqual(
                expect.stringMatching(/^refresh-token=.+/)
            );
        });

        it('returns 400 for unknown email', async () => {
            await loginUser(
                createEmail('login-unknown'),
                password,
                'auth-e2e-login-unknown'
            ).expect(400);
        });

        it('returns 400 for wrong password', async () => {
            const { payload } = await registerUser('login-wrong-password');
            await loginUser(
                payload.email,
                'WrongPass123!',
                'auth-e2e-login-wrong-password'
            ).expect(400);
        });
    });

    describe('GET /api/auth/refresh', () => {
        it('returns new access token and updates refresh cookie for valid cookie', async () => {
            const { refreshCookie } = await registerUser('refresh-success');

            const response = await request(app.getHttpServer())
                .get('/api/auth/refresh')
                .set('Cookie', refreshCookie)
                .set('User-Agent', 'auth-e2e-refresh-success')
                .expect(200);

            expect(response.body).toEqual({
                accessToken: expect.any(String)
            });
            expect(getRefreshCookie(response)).not.toEqual(refreshCookie);
        });

        it('returns 401 without cookie', async () => {
            await request(app.getHttpServer())
                .get('/api/auth/refresh')
                .set('User-Agent', 'auth-e2e-refresh-no-cookie')
                .expect(401);
        });

        it('returns 401 for non-existing token', async () => {
            await request(app.getHttpServer())
                .get('/api/auth/refresh')
                .set(
                    'Cookie',
                    'refresh-token=00000000-0000-0000-0000-000000000000'
                )
                .set('User-Agent', 'auth-e2e-refresh-missing-token')
                .expect(401);
        });

        it('returns 401 for expired token', async () => {
            const { refreshCookie } = await registerUser('refresh-expired');

            await prismaService.token.update({
                where: {
                    token: getRefreshTokenValue(refreshCookie)
                },
                data: {
                    expiryDate: new Date(Date.now() - 60_000)
                }
            });

            await request(app.getHttpServer())
                .get('/api/auth/refresh')
                .set('Cookie', refreshCookie)
                .set('User-Agent', 'auth-e2e-refresh-expired')
                .expect(401);
        });
    });

    describe('GET /api/auth/logout', () => {
        it('deletes valid refresh token and clears cookie', async () => {
            const { refreshCookie } = await registerUser('logout-success');
            const token = getRefreshTokenValue(refreshCookie);

            const response = await request(app.getHttpServer())
                .get('/api/auth/logout')
                .set('Cookie', refreshCookie)
                .expect(200);

            expect(
                getSetCookies(response).some(cookie =>
                    cookie.startsWith('refresh-token=;')
                )
            ).toBe(true);
            await expect(
                prismaService.token.findFirst({ where: { token } })
            ).resolves.toBeNull();
        });

        it('returns 401 without cookie', async () => {
            await request(app.getHttpServer())
                .get('/api/auth/logout')
                .expect(401);
        });
    });

    describe('GET /api/auth/resend-verification', () => {
        it('returns 401 without bearer token', async () => {
            await request(app.getHttpServer())
                .get('/api/auth/resend-verification')
                .expect(401);
        });

        it('resends code for unverified user', async () => {
            const { accessToken, userId } =
                await registerUser('resend-success');
            const oldCode = await getUserCode(userId);
            await makeUserCodeRetryable(userId);
            mailServiceMock.sendVerificationCode.mockClear();

            await request(app.getHttpServer())
                .get('/api/auth/resend-verification')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            const codes = await prismaService.code.findMany({
                where: { userId }
            });
            expect(codes).toHaveLength(1);
            expect(codes[0].id).not.toBe(oldCode.id);
        });

        it('returns 400 when code was already sent recently', async () => {
            const { accessToken, userId } = await registerUser('resend-retry');
            await makeUserCodeRetryable(userId);

            await request(app.getHttpServer())
                .get('/api/auth/resend-verification')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            await request(app.getHttpServer())
                .get('/api/auth/resend-verification')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(400);
        });

        it('returns 400 for already verified user', async () => {
            const { accessToken, userId } =
                await registerUser('resend-verified');
            await prismaService.user.update({
                where: { id: userId },
                data: { isVerified: true }
            });

            await request(app.getHttpServer())
                .get('/api/auth/resend-verification')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(400);
        });
    });

    describe('POST /api/auth/verify', () => {
        it('returns 401 without bearer token', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/verify')
                .send({ code: '123456' })
                .expect(401);
        });

        it('verifies user with correct code', async () => {
            const { accessToken, userId } =
                await registerUser('verify-success');
            const { code } = await getUserCode(userId);

            await request(app.getHttpServer())
                .post('/api/auth/verify')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ code })
                .expect(201);

            await expect(
                prismaService.user.findFirst({ where: { id: userId } })
            ).resolves.toEqual(expect.objectContaining({ isVerified: true }));
        });

        it('returns 400 for wrong code', async () => {
            const { accessToken } = await registerUser('verify-wrong-code');

            await request(app.getHttpServer())
                .post('/api/auth/verify')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ code: '000000' })
                .expect(400);
        });

        it('returns 400 for expired code', async () => {
            const { accessToken, userId } =
                await registerUser('verify-expired');
            const { code } = await getUserCode(userId);

            await prismaService.code.updateMany({
                where: { userId },
                data: {
                    expiryDate: new Date(Date.now() - 60_000)
                }
            });

            await request(app.getHttpServer())
                .post('/api/auth/verify')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ code })
                .expect(400);
        });

        it('returns 400 when user is already verified', async () => {
            const { accessToken, userId } = await registerUser('verify-repeat');
            const { code } = await getUserCode(userId);

            await request(app.getHttpServer())
                .post('/api/auth/verify')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ code })
                .expect(201);

            await request(app.getHttpServer())
                .post('/api/auth/verify')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ code: '123456' })
                .expect(400);
        });
    });

    describe('POST /api/auth/send-recovery', () => {
        it('sends recovery code for existing email', async () => {
            const { payload, userId } = await registerUser('send-recovery');
            await prismaService.code.deleteMany({ where: { userId } });
            mailServiceMock.sendPasswordRecoveryCode.mockClear();

            await request(app.getHttpServer())
                .post('/api/auth/send-recovery')
                .send({ email: payload.email })
                .expect(200);

            const response = await getUserCode(userId);
            expect(response.code).toEqual(expect.stringMatching(/^\d{6}$/));
        });

        it('returns 200 without sending code for non-existing email', async () => {
            const codeCountBefore = await prismaService.code.count();
            mailServiceMock.sendPasswordRecoveryCode.mockClear();

            await request(app.getHttpServer())
                .post('/api/auth/send-recovery')
                .send({ email: createEmail('send-recovery-missing') })
                .expect(200);

            await expect(prismaService.code.count()).resolves.toBe(
                codeCountBefore
            );
        });

        it('returns 400 when recovery code was already sent recently', async () => {
            const { payload, userId } = await registerUser(
                'send-recovery-repeat'
            );
            await prismaService.code.deleteMany({ where: { userId } });

            await request(app.getHttpServer())
                .post('/api/auth/send-recovery')
                .send({ email: payload.email })
                .expect(200);

            await request(app.getHttpServer())
                .post('/api/auth/send-recovery')
                .send({ email: payload.email })
                .expect(400);
        });
    });

    describe('POST /api/auth/verify-recovery', () => {
        it('validates recovery code and returns a new code', async () => {
            const { payload, userId } = await registerUser('verify-recovery');
            await prismaService.code.deleteMany({ where: { userId } });
            await request(app.getHttpServer())
                .post('/api/auth/send-recovery')
                .send({ email: payload.email })
                .expect(200);
            const oldCode = await getUserCode(userId);

            const response = await request(app.getHttpServer())
                .post('/api/auth/verify-recovery')
                .send({
                    email: payload.email,
                    code: oldCode.code
                })
                .expect(201);

            expect(response.body).toEqual({
                code: expect.stringMatching(/^\d{6}$/)
            });
            await expect(
                prismaService.code.findFirst({ where: { id: oldCode.id } })
            ).resolves.toBeNull();
        });

        it('returns 400 for non-existing email', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/verify-recovery')
                .send({
                    email: createEmail('verify-recovery-missing'),
                    code: '123456'
                })
                .expect(400);
        });

        it('returns 400 for wrong code', async () => {
            const { payload } = await registerUser('verify-recovery-wrong');

            await request(app.getHttpServer())
                .post('/api/auth/verify-recovery')
                .send({
                    email: payload.email,
                    code: '000000'
                })
                .expect(400);
        });

        it('returns 400 for expired code', async () => {
            const { payload, userId } = await registerUser(
                'verify-recovery-expired'
            );
            const { code } = await getUserCode(userId);
            await prismaService.code.updateMany({
                where: { userId },
                data: {
                    expiryDate: new Date(Date.now() - 60_000)
                }
            });

            await request(app.getHttpServer())
                .post('/api/auth/verify-recovery')
                .send({
                    email: payload.email,
                    code
                })
                .expect(400);
        });

        it('returns a code that can be used for password recovery', async () => {
            const { payload, userId } = await registerUser(
                'verify-recovery-usable'
            );
            await prismaService.code.deleteMany({ where: { userId } });
            await request(app.getHttpServer())
                .post('/api/auth/send-recovery')
                .send({ email: payload.email })
                .expect(200);
            const { code } = await getUserCode(userId);

            const verifyResponse = await request(app.getHttpServer())
                .post('/api/auth/verify-recovery')
                .send({
                    email: payload.email,
                    code
                })
                .expect(201);

            await request(app.getHttpServer())
                .post('/api/auth/recovery-password')
                .send({
                    email: payload.email,
                    code: verifyResponse.body.code,
                    password: newPassword
                })
                .expect(200);
        });
    });

    describe('POST /api/auth/recovery-password', () => {
        it('changes password with valid recovery code', async () => {
            const { payload, userId } = await registerUser('recovery-password');
            await prismaService.code.deleteMany({ where: { userId } });
            await request(app.getHttpServer())
                .post('/api/auth/send-recovery')
                .send({ email: payload.email })
                .expect(200);
            const { code } = await getUserCode(userId);

            await request(app.getHttpServer())
                .post('/api/auth/recovery-password')
                .send({
                    email: payload.email,
                    code,
                    password: newPassword
                })
                .expect(200);

            await loginUser(
                payload.email,
                password,
                'auth-e2e-recovery-old-password'
            ).expect(400);
            await loginUser(
                payload.email,
                newPassword,
                'auth-e2e-recovery-new-password'
            ).expect(201);
        });

        it('returns 400 for non-existing email', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/recovery-password')
                .send({
                    email: createEmail('recovery-password-missing'),
                    code: '123456',
                    password: newPassword
                })
                .expect(400);
        });

        it('returns 400 for wrong code', async () => {
            const { payload } = await registerUser('recovery-password-wrong');

            await request(app.getHttpServer())
                .post('/api/auth/recovery-password')
                .send({
                    email: payload.email,
                    code: '000000',
                    password: newPassword
                })
                .expect(400);
        });

        it('returns 400 for expired code', async () => {
            const { payload, userId } = await registerUser(
                'recovery-password-expired'
            );
            const { code } = await getUserCode(userId);
            await prismaService.code.updateMany({
                where: { userId },
                data: {
                    expiryDate: new Date(Date.now() - 60_000)
                }
            });

            await request(app.getHttpServer())
                .post('/api/auth/recovery-password')
                .send({
                    email: payload.email,
                    code,
                    password: newPassword
                })
                .expect(400);
        });

        it('returns 400 when reusing code after successful password recovery', async () => {
            const { payload, userId } = await registerUser(
                'recovery-password-reuse'
            );
            await prismaService.code.deleteMany({ where: { userId } });
            await request(app.getHttpServer())
                .post('/api/auth/send-recovery')
                .send({ email: payload.email })
                .expect(200);
            const { code } = await getUserCode(userId);

            await request(app.getHttpServer())
                .post('/api/auth/recovery-password')
                .send({
                    email: payload.email,
                    code,
                    password: newPassword
                })
                .expect(200);

            await request(app.getHttpServer())
                .post('/api/auth/recovery-password')
                .send({
                    email: payload.email,
                    code,
                    password
                })
                .expect(400);
        });
    });

    describe('PATCH /api/auth/change-password', () => {
        it('returns 401 without bearer token', async () => {
            await request(app.getHttpServer())
                .patch('/api/auth/change-password')
                .send({
                    oldPassword: password,
                    newPassword
                })
                .expect(401);
        });

        it('changes password with valid old password', async () => {
            const { accessToken, payload } =
                await registerUser('change-password');

            await request(app.getHttpServer())
                .patch('/api/auth/change-password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    oldPassword: password,
                    newPassword
                })
                .expect(200);

            await loginUser(
                payload.email,
                password,
                'auth-e2e-change-old-password'
            ).expect(400);
            await loginUser(
                payload.email,
                newPassword,
                'auth-e2e-change-new-password'
            ).expect(201);
        });

        it('returns 400 for wrong old password', async () => {
            const { accessToken } = await registerUser('change-password-wrong');

            await request(app.getHttpServer())
                .patch('/api/auth/change-password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    oldPassword: 'WrongPass123!',
                    newPassword
                })
                .expect(400);
        });
    });
});
