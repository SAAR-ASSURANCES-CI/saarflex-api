import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersController } from './users.controller';
import { UploadController } from './controllers/upload.controller';
import { UsersService } from './users.service';
import { UploadService } from './services/upload.service';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import { Session } from './entities/session.entity';
import { Notification } from './entities/notification.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { DevisSimule } from '../produits/entities/devis-simule.entity';
import { JwtService as CustomJwtService } from '../users/jwt/jwt.service';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { EmailModule } from './email/email.module';

// Services spécialisés
import { AuthService } from './services/auth.service';
import { PasswordResetService } from './services/password-reset.service';
import { ProfileService } from './services/profile.service';
import { SessionService } from './services/session.service';
import { NotificationService } from './services/notification.service';
import { UserManagementService } from './services/user-management.service';
import { DateUtilsService } from './utils/date-utils.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, 
      Profile, 
      Session, 
      Notification, 
      PasswordReset,
      DevisSimule
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
  controllers: [UsersController, UploadController],
  providers: [
    // Façade principal
    UsersService,
    
    // Services spécialisés
    AuthService,
    PasswordResetService,
    ProfileService,
    SessionService,
    NotificationService,
    UserManagementService,
    
    // Utilitaires
    DateUtilsService,
    
    // Autres services
    UploadService,
    CustomJwtService,
    
    // Guards
    JwtAuthGuard,
    AdminGuard,
  ],
  exports: [
    UsersService,
    CustomJwtService,
    JwtAuthGuard,
    AdminGuard,
    TypeOrmModule,
    // Export des services pour réutilisation dans d'autres modules
    UserManagementService,
    ProfileService,
    DateUtilsService,
  ],
})
export class UsersModule { }