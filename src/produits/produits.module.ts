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
import { Garantie } from './entities/garantie.entity';
import { GarantieCritere } from './entities/garantie-critere.entity';
import { TarifGarantie } from './entities/tarif-garantie.entity';
import { ProduitsService } from './produits.service';
import { ProduitsController } from './produits.controller';
import { BranchesAdminService } from './branches-admin.service';
import { BranchesAdminController } from './branches-admin.controller';
import { ProduitsAdminService } from './produits-admin.service';
import { ProduitsAdminController } from './produits-admin.controller';
import { CriteresAdminService } from './criteres-admin.service';
import { CriteresAdminController } from './criteres-admin.controller';
import { GarantiesAdminService } from './garanties-admin.service';
import { GarantiesAdminController } from './garanties-admin.controller';
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
      DevisSimule,
      Garantie,
      GarantieCritere,
      TarifGarantie
    ]),
    UsersModule,
  ],
  controllers: [ProduitsController, BranchesAdminController, ProduitsAdminController, CriteresAdminController, GarantiesAdminController],
  providers: [ProduitsService, BranchesAdminService, ProduitsAdminService, CriteresAdminService, GarantiesAdminService],
  exports: [TypeOrmModule, ProduitsService, BranchesAdminService, ProduitsAdminService, CriteresAdminService, GarantiesAdminService],
})
export class ProduitsModule {}
