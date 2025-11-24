import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from './src/users/entities/user.entity';
import { Session } from './src/users/entities/session.entity';
import { Notification } from './src/users/entities/notification.entity';
import { Profile } from './src/users/entities/profile.entity';
import { PasswordReset } from './src/users/entities/password-reset.entity';
import { BrancheProduit } from './src/produits/entities/branche-produit.entity';
import { CategorieProduit } from './src/produits/entities/categorie-produit.entity';
import { Produit } from './src/produits/entities/produit.entity';
import { CritereTarification } from './src/produits/entities/critere-tarification.entity';
import { ValeurCritere } from './src/produits/entities/valeur-critere.entity';
import { GrilleTarifaire } from './src/produits/entities/grille-tarifaire.entity';
import { Tarif } from './src/produits/entities/tarif.entity';
import { DevisSimule } from './src/produits/entities/devis-simule.entity';
import { Garantie } from './src/produits/entities/garantie.entity';
import { GarantieCritere } from './src/produits/entities/garantie-critere.entity';
import { TarifGarantie } from './src/produits/entities/tarif-garantie.entity';
import { Beneficiaire } from './src/produits/entities/beneficiaire.entity';
import { DocumentIdentite } from './src/produits/entities/document-identite.entity';
import { Contrat } from './src/produits/entities/contrat.entity';
import { Paiement } from './src/produits/entities/paiement.entity';

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
    Paiement
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: true,
});