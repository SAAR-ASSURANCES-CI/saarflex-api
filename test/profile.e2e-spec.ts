import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

describe('ProfileController (e2e)', () => {
    let app: INestApplication;
    let authToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideGuard(ThrottlerGuard)
            .useValue({ canActivate: () => true })
            .overrideProvider(APP_GUARD)
            .useValue({ canActivate: () => true })
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));
        await app.init();

        // Register and login to get a token
        const uniqueEmail = `profile-e2e-${Date.now()}@example.com`;
        const credentials = {
            nom: 'Profile Test User',
            email: uniqueEmail,
            mot_de_passe: 'Password123!',
        };

        const regResponse = await request(app.getHttpServer())
            .post('/users/register')
            .send(credentials)
            .expect(201);

        authToken = regResponse.body.data.token;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /users/me', () => {
        it('should return the current user profile', () => {
            return request(app.getHttpServer())
                .get('/users/me')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200)
                .then(response => {
                    expect(response.body.status).toBe('success');
                    expect(response.body.data).toHaveProperty('email');
                    expect(response.body.data.nom).toBe('Profile Test User');
                });
        });

        it('should return 401 if no token is provided', () => {
            return request(app.getHttpServer())
                .get('/users/me')
                .expect(401);
        });
    });

    describe('PATCH /users/me', () => {
        it('should update the profile successfully', () => {
            const updatePayload = {
                nom: 'Updated Name',
                adresse: 'New Address, Abidjan',
                lieu_naissance: 'Bouaké',
            };

            return request(app.getHttpServer())
                .patch('/users/me')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updatePayload)
                .expect(200)
                .then(response => {
                    expect(response.body.status).toBe('success');
                    expect(response.body.data.nom).toBe('Updated Name');
                    expect(response.body.data.adresse).toBe('New Address, Abidjan');
                    expect(response.body.data.lieu_naissance).toBe('Bouaké');
                });
        });

        it('should return 400 for invalid data (e.g. invalid date format)', () => {
            return request(app.getHttpServer())
                .patch('/users/me')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ date_naissance: 'invalid-date' })
                .expect(400);
        });
    });
});
