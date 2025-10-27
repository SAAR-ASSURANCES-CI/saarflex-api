import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AgentDashboardController } from './controllers/agent-dashboard.controller';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AgentDashboardService } from './services/agent-dashboard.service';
import { Produit } from '../produits/entities/produit.entity';
import { Contrat } from '../produits/entities/contrat.entity';
import { DevisSimule } from '../produits/entities/devis-simule.entity';
import { Paiement } from '../produits/entities/paiement.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Produit,
      Contrat,
      DevisSimule,
      Paiement,
      User,
    ]),
    UsersModule,
  ],
  controllers: [AdminDashboardController, AgentDashboardController],
  providers: [AdminDashboardService, AgentDashboardService],
  exports: [AdminDashboardService, AgentDashboardService],
})
export class DashboardModule {}

