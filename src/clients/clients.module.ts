import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { User } from '../users/entities/user.entity';
import { Profile } from '../users/entities/profile.entity';
import { DevisSimule } from '../produits/entities/devis-simule.entity';
import { Contrat } from '../produits/entities/contrat.entity';
import { Paiement } from '../produits/entities/paiement.entity';
import { UsersModule } from '../users/users.module';

/**
 * Module de gestion des clients
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile, DevisSimule, Contrat, Paiement]),
    UsersModule,
    ConfigModule,
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule { }

