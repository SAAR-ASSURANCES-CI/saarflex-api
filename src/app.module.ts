import { Module, ValidationPipe } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ProduitsModule } from './produits/produits.module';
import { ConfigurationModule } from './config/configuration.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from './users/entities/profile.entity';
import { APP_PIPE, APP_GUARD } from '@nestjs/core';
import { User } from './users/entities/user.entity';
import { Notification } from './users/entities/notification.entity';
import { Session } from './users/entities/session.entity';
import { PasswordReset } from './users/entities/password-reset.entity';
import { EmailModule } from './users/email/email.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ClientsModule } from './clients/clients.module';
import { BrancheProduit } from './produits/entities/branche-produit.entity';
import { CategorieProduit } from './produits/entities/categorie-produit.entity';
import { Produit } from './produits/entities/produit.entity';
import { CritereTarification } from './produits/entities/critere-tarification.entity';
import { ValeurCritere } from './produits/entities/valeur-critere.entity';
import { GrilleTarifaire } from './produits/entities/grille-tarifaire.entity';
import { Tarif } from './produits/entities/tarif.entity';
import { DevisSimule } from './produits/entities/devis-simule.entity';
import { Garantie } from './produits/entities/garantie.entity';
import { GarantieCritere } from './produits/entities/garantie-critere.entity';
import { TarifGarantie } from './produits/entities/tarif-garantie.entity';
import { Beneficiaire } from './produits/entities/beneficiaire.entity';
import { DocumentIdentite } from './produits/entities/document-identite.entity';
import { Contrat } from './produits/entities/contrat.entity';
import { Paiement } from './produits/entities/paiement.entity';
import { ConfigurationSysteme } from './config/entities/configuration-systeme.entity';
import { EmailTemplate } from './users/email/entities/email-template.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),

    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      }
    ]),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST') ?? 'localhost',
        port: parseInt(configService.get('DB_PORT') ?? '3306', 10),
        username: configService.get('DB_USERNAME') ?? 'saarflex_user',
        password: configService.get('DB_PASSWORD') ?? 'saarflex_password',
        database: configService.get('DB_NAME') ?? 'saarflex_db',
        entities: [
          User,
          Profile,
          Session,
          Notification,
          PasswordReset,
          BrancheProduit,
          CategorieProduit,
          Produit,
          CritereTarification,
          ValeurCritere,
          GrilleTarifaire,
          Tarif,
          DevisSimule,
          Contrat,
          Beneficiaire,
          DocumentIdentite,
          Garantie,
          GarantieCritere,
          TarifGarantie,
          Paiement,
          ConfigurationSysteme,
          EmailTemplate
        ],
        migrations: ['dist/migrations/*.js'],
        migrationsRun: true,
        synchronize: false,
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
    UsersModule,
    ProduitsModule,
    DashboardModule,
    ClientsModule
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
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    AppService,
  ],
})
export class AppModule { }