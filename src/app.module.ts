import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_PIPE } from '@nestjs/core';
import { User } from './users/entities/user.entity';
import { Notification } from './users/entities/notification.entity';
import { Session } from './users/entities/session.entity';
import { PasswordReset } from './users/entities/password-reset.entity';
import { EmailModule } from './users/email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST') ?? '',
        port: parseInt(configService.get('DB_PORT') ?? '3306', 10),
        username: configService.get('DB_USERNAME') ?? '',
        password: configService.get('DB_PASSWORD') ?? '',
        database: configService.get('DB_NAME') ?? '',
        entities: [User, Session, Notification, PasswordReset],
        migrations: ['dist/migrations/*.js'], 
        migrationsRun: true,
        synchronize: false,
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
    UsersModule, 
    EmailModule
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: process.env.NODE_ENV === 'production',
      }),
    },
    AppService,
  ],
})
export class AppModule { }