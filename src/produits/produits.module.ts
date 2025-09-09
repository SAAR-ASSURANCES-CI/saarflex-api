import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { ProduitsAdminController } from './admin/controllers/produits-admin.controller';
import { BranchesAdminController } from './admin/controllers/branches-admin.controller';
import { CriteresAdminController } from './admin/controllers/criteres-admin.controller';
import { GarantiesAdminController } from './admin/controllers/garanties-admin.controller';
import { GrillesTarifairesAdminController } from './admin/controllers/grilles-tarifaires-admin.controller';
import { TarifsAdminController } from './admin/controllers/tarifs-admin.controller';
import { ProduitsController } from './public/controllers/produits.controller';
import { SimulationDevisSimplifieeController } from './public/controllers/simulation-devis-simplifie.controller';
import { DevisSauvegardeController } from './public/controllers/devis-sauvegarde.controller';
import { GrillesTarifairesController } from './public/controllers/grilles-tarifaires.controller';
import { ProduitsAdminService } from './admin/services/produits-admin.service';
import { BranchesAdminService } from './admin/services/branches-admin.service';
import { CriteresAdminService } from './admin/services/criteres-admin.service';
import { GarantiesAdminService } from './admin/services/garanties-admin.service';
import { GrillesTarifairesAdminService } from './admin/services/grilles-tarifaires-admin.service';
import { TarifsAdminService } from './admin/services/tarifs-admin.service';
import { ProduitsService } from './public/services/produits.service';
import { SimulationDevisSimplifieeService } from './public/services/simulation-devis-simplifie.service';
import { DevisSauvegardeService } from './public/services/devis-sauvegarde.service';
import { GrillesTarifairesService } from './public/services/grilles-tarifaires.service';
import { TachePlanifieeService } from './services/tache-planifiee.service';
import { Produit } from './entities/produit.entity';
import { BrancheProduit } from './entities/branche-produit.entity';
import { CritereTarification } from './entities/critere-tarification.entity';
import { ValeurCritere } from './entities/valeur-critere.entity';
import { GrilleTarifaire } from './entities/grille-tarifaire.entity';
import { Tarif } from './entities/tarif.entity';
import { DevisSimule } from './entities/devis-simule.entity';
import { Garantie } from './entities/garantie.entity';
import { GarantieCritere } from './entities/garantie-critere.entity';
import { TarifGarantie } from './entities/tarif-garantie.entity';
import { Beneficiaire } from './entities/beneficiaire.entity';
import { DocumentIdentite } from './entities/document-identite.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Produit,
      BrancheProduit,
      CritereTarification,
      ValeurCritere,
      GrilleTarifaire,
      Tarif,
      DevisSimule,
      Beneficiaire,
      DocumentIdentite,
      Garantie,
      GarantieCritere,
      TarifGarantie
    ]),
    UsersModule
  ],
  controllers: [
    ProduitsAdminController,
    BranchesAdminController,
    CriteresAdminController,
    GarantiesAdminController,
    GrillesTarifairesAdminController,
    TarifsAdminController,
    ProduitsController,
    SimulationDevisSimplifieeController,
    DevisSauvegardeController,
    GrillesTarifairesController
  ],
  providers: [
    ProduitsAdminService,
    BranchesAdminService,
    CriteresAdminService,
    GarantiesAdminService,
    GrillesTarifairesAdminService,
    TarifsAdminService,
    ProduitsService,
    SimulationDevisSimplifieeService,
    DevisSauvegardeService,
    GrillesTarifairesService,
    TachePlanifieeService
  ],
  exports: [
    ProduitsAdminService,
    BranchesAdminService,
    CriteresAdminService,
    GarantiesAdminService,
    GrillesTarifairesAdminService,
    TarifsAdminService,
    ProduitsService,
    SimulationDevisSimplifieeService,
    DevisSauvegardeService,
    GrillesTarifairesService
  ]
})
export class ProduitsModule {}
