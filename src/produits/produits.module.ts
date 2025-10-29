import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';

// Contrôleurs Admin
import { ProduitsAdminController } from './admin/controllers/produits-admin.controller';
import { BranchesAdminController } from './admin/controllers/branches-admin.controller';
import { CriteresAdminController } from './admin/controllers/criteres-admin.controller';
import { GarantiesAdminController } from './admin/controllers/garanties-admin.controller';
import { GrillesTarifairesAdminController } from './admin/controllers/grilles-tarifaires-admin.controller';
import { TarifsAdminController } from './admin/controllers/tarifs-admin.controller';
import { DevisAdminController } from './admin/controllers/devis-admin.controller';
import { DevisAgentController } from './admin/controllers/devis-agent.controller';

// Contrôleurs Public
import { ProduitsController } from './public/controllers/produits.controller';
import { SimulationDevisSimplifieeController } from './public/controllers/simulation-devis-simplifie.controller';
import { DevisSauvegardeController } from './public/controllers/devis-sauvegarde.controller';
import { GrillesTarifairesController } from './public/controllers/grilles-tarifaires.controller';
import { SouscriptionController } from './public/controllers/souscription.controller';
import { PaiementWebhookController } from './public/controllers/paiement-webhook.controller';
import { ContratsController } from './public/controllers/contrats.controller';

// Services Admin
import { ProduitsAdminService } from './admin/services/produits-admin.service';
import { BranchesAdminService } from './admin/services/branches-admin.service';
import { CriteresAdminService } from './admin/services/criteres-admin.service';
import { GarantiesAdminService } from './admin/services/garanties-admin.service';
import { GrillesTarifairesAdminService } from './admin/services/grilles-tarifaires-admin.service';
import { TarifsAdminService } from './admin/services/tarifs-admin.service';
import { DevisAdminService } from './admin/services/devis-admin.service';

// Services Public
import { ProduitsService } from './public/services/produits.service';
import { SimulationDevisSimplifieeService } from './public/services/simulation-devis-simplifie.service';
import { DevisSauvegardeService } from './public/services/devis-sauvegarde.service';
import { GrillesTarifairesService } from './public/services/grilles-tarifaires.service';

// Services Spécialisés (nouveau)
import { DevisValidationService } from './services/devis-validation.service';
import { TarifCalculationService } from './services/tarif-calculation.service';
import { CriteresEnrichmentService } from './services/criteres-enrichment.service';
import { DevisCreationService } from './services/devis-creation.service';
import { BeneficiaireService } from './services/beneficiaire.service';
import { DevisMapperService } from './services/devis-mapper.service';
import { TachePlanifieeService } from './services/tache-planifiee.service';
import { PaiementService } from './services/paiement.service';
import { ContratService } from './services/contrat.service';
import { SouscriptionService } from './services/souscription.service';

// Entités
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
import { Contrat } from './entities/contrat.entity';
import { Paiement } from './entities/paiement.entity';
import { User } from '../users/entities/user.entity';

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
      TarifGarantie,
      Contrat,
      Paiement,
      User
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
    DevisAdminController,
    DevisAgentController,
    ProduitsController,
    SimulationDevisSimplifieeController,
    DevisSauvegardeController,
    GrillesTarifairesController,
    SouscriptionController,
    PaiementWebhookController,
    ContratsController
  ],
  providers: [
    // Services Admin
    ProduitsAdminService,
    BranchesAdminService,
    CriteresAdminService,
    GarantiesAdminService,
    GrillesTarifairesAdminService,
    TarifsAdminService,
    DevisAdminService,
    
    // Services Public
    ProduitsService,
    SimulationDevisSimplifieeService,
    DevisSauvegardeService,
    GrillesTarifairesService,
    
    // Services Spécialisés (simulation devis)
    DevisValidationService,
    TarifCalculationService,
    CriteresEnrichmentService,
    DevisCreationService,
    BeneficiaireService,
    DevisMapperService,
    
    // Services de souscription et paiement
    PaiementService,
    ContratService,
    SouscriptionService,
    
    // Autres services
    TachePlanifieeService,
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
    GrillesTarifairesService,
    // Export des services spécialisés pour réutilisation
    BeneficiaireService,
    TarifCalculationService,
    PaiementService,
    ContratService,
    SouscriptionService,
  ]
})
export class ProduitsModule {}
