import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { EmailService } from '../src/users/email/email.service';

describe('AuthController (e2e)', () => {
    let app: INestApplication;
    let lastOtpCode: string;

    const mockEmailService = {
        sendPasswordResetCode: jest.fn((email, code) => {
            lastOtpCode = code;
            return Promise.resolve();
        }),
        sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideGuard(ThrottlerGuard)
            .useValue({ canActivate: () => true })
            .overrideProvider(APP_GUARD)
            .useValue({ canActivate: () => true })
            .overrideProvider(EmailService)
            .useValue(mockEmailService)
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Authentication Flow', () => {
        const uniqueEmail = `flow-${Date.now()}@example.com`;
        const userCredentials = {
            nom: 'Flow Test User',
            email: uniqueEmail,
            mot_de_passe: 'Password123!',
            telephone: `+225${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        };

        it('should register a new user successfully', () => {
            return request(app.getHttpServer())
                .post('/users/register')
                .send(userCredentials)
                .expect(201)
                .then(response => {
                    expect(response.body.status).toBe('success');
                    expect(response.body.data).toHaveProperty('token');
                    expect(response.body.data.email).toBe(userCredentials.email);
                });
        });

        it('should return 409 if email already exists', () => {
            return request(app.getHttpServer())
                .post('/users/register')
                .send(userCredentials)
                .expect(409);
        });

        it('should login successfully with correct credentials', () => {
            return request(app.getHttpServer())
                .post('/users/login')
                .send({
                    email: userCredentials.email,
                    mot_de_passe: userCredentials.mot_de_passe,
                })
                .expect(201)
                .then(response => {
                    expect(response.body.status).toBe('success');
                    expect(response.body.data).toHaveProperty('token');
                });
        });

        it('should return 401 for incorrect password', () => {
            return request(app.getHttpServer())
                .post('/users/login')
                .send({
                    email: userCredentials.email,
                    mot_de_passe: 'WrongPassword!',
                })
                .expect(401);
        });

        it('should return 400 if registration validation fails', () => {
            return request(app.getHttpServer())
                .post('/users/register')
                .send({ ...userCredentials, email: 'invalid-email' })
                .expect(400);
        });

        it('should trigger forgot password and receive OTP', async () => {
            await request(app.getHttpServer())
                .post('/users/forgot-password')
                .send({ email: userCredentials.email })
                .expect(201); // AuthController returns 201 for POST

            expect(lastOtpCode).toBeDefined();
            expect(lastOtpCode.length).toBe(6);
        });

        it('should verify the received OTP', () => {
            return request(app.getHttpServer())
                .post('/users/verify-otp')
                .send({
                    email: userCredentials.email,
                    code: lastOtpCode,
                })
                .expect(201)
                .then(response => {
                    expect(response.body.status).toBe('success');
                });
        });

        it('should reset password using OTP', async () => {
            const newPassword = 'NewPassword123!';
            await request(app.getHttpServer())
                .post('/users/reset-password')
                .send({
                    email: userCredentials.email,
                    code: lastOtpCode,
                    nouveau_mot_de_passe: newPassword,
                })
                .expect(201);

            // Verify login with new password
            await request(app.getHttpServer())
                .post('/users/login')
                .send({
                    email: userCredentials.email,
                    mot_de_passe: newPassword,
                })
                .expect(201);
        });
    });
});
