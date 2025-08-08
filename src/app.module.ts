import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersService } from './users/users.service';
import { UsersController } from './users/users.controller';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_PIPE, APP_FILTER } from '@nestjs/core';
import { User } from './users/entities/user.entity';
import { Notification } from './users/entities/notification.entity';
import { Session } from './users/entities/session.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'mysql',
        host: process.env.DB_HOST ?? '',
        port: parseInt(process.env.DB_PORT ?? '3306', 10),
        username: process.env.DB_USERNAME ?? '',
        password: process.env.DB_PASSWORD ?? '',
        database: process.env.DB_NAME ?? '',
        entities: [User, Session, Notification],
        synchronize: true,
        logging: process.env.NODE_ENV === 'development',
      }),
    }),
    UsersModule
  ],
  controllers: [AppController, UsersController],
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
    UsersService
  ],
})
export class AppModule { }
