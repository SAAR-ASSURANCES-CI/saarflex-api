import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { writeFileSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'debug'],
  });

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    })
  );

  app.useStaticAssets(join(__dirname, '..', '..', 'uploads'), {
    prefix: '/uploads/',
  });


  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('SAARCIFLEX')
      .setDescription('API backend de l\' Saarciflex')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('SAARCIFLEX')
      .build();
    // const documentFactory = () => SwaggerModule.createDocument(app, config);
    // SwaggerModule.setup('api', app, documentFactory, {
    //   swaggerOptions: {
    //     persistAuthorization: true,
    //   },
    // });
    const document = SwaggerModule.createDocument(app, config)
    const outputPath = join(process.cwd(), 'swagger-spec.json');
    try {
      writeFileSync(outputPath, JSON.stringify(document, null, 2));
      console.log(`Swagger document saved to ${outputPath}`);
    } catch (error) {
      console.error(`Error writing Swagger document: ${error}`);
    }

    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  //config microservice Redis (optionnel)
  const redisHost = process.env.REDIS_HOST;
  const redisEnabled = process.env.REDIS_ENABLED !== 'false' && redisHost && redisHost !== '';

  if (redisEnabled) {
    try {
      console.log(`[Redis] Tentative de connexion à Redis sur ${redisHost}:${process.env.REDIS_PORT || 6379}`);
      app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.REDIS,
        options: {
          host: redisHost,
          port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
          password: process.env.REDIS_PASSWORD ?? '',
          db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : 0,
          retryDelay: 100,
          retryAttempts: 3,
          lazyConnect: true,
        },
      });

      //start microservice avec gestion d'erreur améliorée
      try {
        await app.startAllMicroservices();
        console.log('[Redis]  Microservice Redis démarré avec succès');
      } catch (microserviceError: any) {
        console.warn(`[Redis]  Erreur lors du démarrage du microservice Redis: ${microserviceError.message}`);
        console.warn('[Redis]  L\'application continuera sans Redis. Les fonctionnalités microservices seront désactivées.');
      }
    } catch (error: any) {
      console.warn(`[Redis]  Impossible de configurer le microservice Redis: ${error.message}`);
      console.warn('[Redis]  L\'application continuera sans Redis. Les fonctionnalités microservices seront désactivées.');
    }
  } else {
    console.log('[Redis]  Redis désactivé (REDIS_ENABLED=false ou REDIS_HOST non défini)');
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((error) => {
  console.error('Erreur lors du démarrage:', error);
  process.exit(1);
});
