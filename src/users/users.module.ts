import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import { Session } from './entities/session.entity';
import { Notification } from './entities/notification.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { JwtService as CustomJwtService } from '../users/jwt/jwt.service';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, 
      Profile, 
      Session, Notification, 
      PasswordReset
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'secret-key',
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN') || '24h',
        },
      }),
    }),
    EmailModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, CustomJwtService, JwtAuthGuard],
  exports: [UsersService, CustomJwtService, TypeOrmModule],
})
export class UsersModule { }