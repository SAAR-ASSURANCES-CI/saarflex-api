import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrancheProduit } from './entities/branche-produit.entity';
import { Produit } from './entities/produit.entity';
import { CritereTarification } from './entities/critere-tarification.entity';
import { ValeurCritere } from './entities/valeur-critere.entity';
import { GrilleTarifaire } from './entities/grille-tarifaire.entity';
import { Tarif } from './entities/tarif.entity';
import { FormuleCalcul } from './entities/formule-calcul.entity';
import { DevisSimule } from './entities/devis-simule.entity';
import { ProduitsService } from './produits.service';
import { ProduitsController } from './produits.controller';
import { BranchesAdminService } from './branches-admin.service';
import { BranchesAdminController } from './branches-admin.controller';
import { ProduitsAdminService } from './produits-admin.service';
import { ProduitsAdminController } from './produits-admin.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BrancheProduit,
      Produit,
      CritereTarification,
      ValeurCritere,
      GrilleTarifaire,
      Tarif,
      FormuleCalcul,
      DevisSimule
    ]),
    UsersModule,
  ],
  controllers: [ProduitsController, BranchesAdminController, ProduitsAdminController],
  providers: [ProduitsService, BranchesAdminService, ProduitsAdminService],
  exports: [TypeOrmModule, ProduitsService, BranchesAdminService, ProduitsAdminService],
})
export class ProduitsModule {}
