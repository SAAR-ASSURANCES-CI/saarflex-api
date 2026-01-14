import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Contrôleurs
import { AuthController } from './controllers/auth.controller';
import { ProfileController } from './controllers/profile.controller';
import { UsersEventsController } from './controllers/users-events.controller';
import { UploadController } from './controllers/upload.controller';
import { AgentsAdminController } from './admin/controllers/agents-admin.controller';

// Services
import { UsersService } from './users.service';
import { UploadService } from './services/upload.service';

// Entités
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import { Session } from './entities/session.entity';
import { Notification } from './entities/notification.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { DevisSimule } from '../produits/entities/devis-simule.entity';

// JWT et Guards
import { JwtService as CustomJwtService } from '../users/jwt/jwt.service';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AdminOrAgentGuard } from './guards/admin-or-agent.guard';

// Modules
import { EmailModule } from './email/email.module';

// Services spécialisés
import { AuthService } from './services/auth.service';
import { PasswordResetService } from './services/password-reset.service';
import { ProfileService } from './services/profile.service';
import { SessionService } from './services/session.service';
import { NotificationService } from './services/notification.service';
import { UserManagementService } from './services/user-management.service';
import { DateUtilsService } from './utils/date-utils.service';
import { AgentsAdminService } from './admin/services/agents-admin.service';

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
    forwardRef(() => EmailModule),
    ConfigModule,
  ],
  controllers: [
    AuthController,
    ProfileController,
    UploadController,
    AgentsAdminController,
    UsersEventsController,
  ],
  providers: [
    UsersService,

    // Services spécialisés
    AuthService,
    PasswordResetService,
    ProfileService,
    SessionService,
    NotificationService,
    UserManagementService,
    AgentsAdminService,

    // Utilitaires
    DateUtilsService,

    UploadService,
    CustomJwtService,

    // Guards
    JwtAuthGuard,
    AdminGuard,
    AdminOrAgentGuard,
  ],
  exports: [
    UsersService,
    CustomJwtService,
    JwtAuthGuard,
    AdminGuard,
    AdminOrAgentGuard,
    TypeOrmModule,
    UserManagementService,
    ProfileService,
    SessionService,
    DateUtilsService,
    EmailModule,
  ],
})
export class UsersModule { }