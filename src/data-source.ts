import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';
import { Session } from './users/entities/session.entity';
import { Notification } from './users/entities/notification.entity';
import { Profile } from './users/entities/profile.entity';
import { PasswordReset } from './users/entities/password-reset.entity';
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

dotenv.config();

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '3306', 10),
  username: process.env.DB_USERNAME ?? 'root',
  password: process.env.DB_PASSWORD ?? 'admin1234',
  database: process.env.DB_NAME ?? 'saarflex_db',
  entities: [
    User,
    Session,
    Notification,
    Profile,
    PasswordReset,
    // Entités produits
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
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: true,
});