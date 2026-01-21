import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

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

    describe('/users/register (POST)', () => {
        const uniqueEmail = `test-${Date.now()}@example.com`;
        const registerDto = {
            nom: 'Test User',
            email: uniqueEmail,
            mot_de_passe: 'Password123!',
            telephone: `+225${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        };

        it('should register a new user successfully', () => {
            return request(app.getHttpServer())
                .post('/users/register')
                .send(registerDto)
                .expect(201)
                .then(response => {
                    expect(response.body.status).toBe('success');
                    expect(response.body.data).toHaveProperty('token');
                    expect(response.body.data.email).toBe(registerDto.email);
                });
        });

        it('should return 400 if validation fails (short password)', () => {
            return request(app.getHttpServer())
                .post('/users/register')
                .send({ ...registerDto, mot_de_passe: 'short' })
                .expect(400);
        });

        it('should return 409 if email already exists', () => {
            return request(app.getHttpServer())
                .post('/users/register')
                .send(registerDto)
                .expect(409);
        });
    });
});
