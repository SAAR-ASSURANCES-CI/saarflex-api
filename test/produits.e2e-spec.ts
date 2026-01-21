import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { UserType } from '../src/users/entities/user.entity';

describe('Produits (e2e)', () => {
    let app: INestApplication;
    let clientToken: string;
    let adminToken: string;

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

        const clientEmail = `client-prod-${Date.now()}@example.com`;
        const clientReg = await request(app.getHttpServer())
            .post('/users/register')
            .send({
                nom: 'Client Test',
                email: clientEmail,
                mot_de_passe: 'Password123!',
            });
        clientToken = clientReg.body.data.token;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Public Produits API', () => {
        it('GET /produits should return active products', async () => {
            const response = await request(app.getHttpServer())
                .get('/produits')
                .set('Authorization', `Bearer ${clientToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            if (response.body.length > 0) {
                expect(response.body[0]).toHaveProperty('id');
                expect(response.body[0]).toHaveProperty('nom');
            }
        });

        it('GET /produits/:id should return a specific product', async () => {
            const list = await request(app.getHttpServer())
                .get('/produits')
                .set('Authorization', `Bearer ${clientToken}`);

            if (list.body.length > 0) {
                const id = list.body[0].id;
                await request(app.getHttpServer())
                    .get(`/produits/${id}`)
                    .set('Authorization', `Bearer ${clientToken}`)
                    .expect(200)
                    .then(res => {
                        expect(res.body.id).toBe(id);
                    });
            }
        });

        it('GET /produits/:id/criteres should return criteria', async () => {
            const list = await request(app.getHttpServer())
                .get('/produits')
                .set('Authorization', `Bearer ${clientToken}`);

            if (list.body.length > 0) {
                const id = list.body[0].id;
                await request(app.getHttpServer())
                    .get(`/produits/${id}/criteres`)
                    .set('Authorization', `Bearer ${clientToken}`)
                    .expect(200)
                    .then(res => {
                        expect(res.body).toHaveProperty('criteres');
                    });
            }
        });
    });

    describe('Simulation Flow (E2E)', () => {
        it('POST /simulation-devis-simplifie should create a simulation', async () => {
            const list = await request(app.getHttpServer())
                .get('/produits')
                .set('Authorization', `Bearer ${clientToken}`);

            if (list.body.length > 0) {
                const product = list.body[0];

                const simulationData = {
                    produit_id: product.id,
                    assure_est_souscripteur: true,
                    criteres_utilisateur: {}
                };

                const response = await request(app.getHttpServer())
                    .post('/simulation-devis-simplifie')
                    .set('Authorization', `Bearer ${clientToken}`)
                    .send(simulationData);

                if (response.status !== 201) {
                    console.error('Simulation E2E error details:', response.body);
                }

                expect(response.status).toBe(201);
                expect(response.body).toHaveProperty('reference');
            }
        });
    });
});
