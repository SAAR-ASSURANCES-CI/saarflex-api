import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from './src/users/entities/user.entity';
import { Session } from './src/users/entities/session.entity';
import { Notification } from './src/users/entities/notification.entity';
import { Profile } from './src/users/entities/profile.entity';
import { PasswordReset } from './src/users/entities/password-reset.entity';
import { BrancheProduit } from './src/produits/entities/branche-produit.entity';
import { Produit } from './src/produits/entities/produit.entity';
import { CritereTarification } from './src/produits/entities/critere-tarification.entity';
import { ValeurCritere } from './src/produits/entities/valeur-critere.entity';
import { GrilleTarifaire } from './src/produits/entities/grille-tarifaire.entity';
import { Tarif } from './src/produits/entities/tarif.entity';
import { FormuleCalcul } from './src/produits/entities/formule-calcul.entity';
import { DevisSimule } from './src/produits/entities/devis-simule.entity';
import { Garantie } from './src/produits/entities/garantie.entity';
import { GarantieCritere } from './src/produits/entities/garantie-critere.entity';
import { TarifGarantie } from './src/produits/entities/tarif-garantie.entity';

dotenv.config();

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '3307', 10),
  username: process.env.DB_USERNAME ?? 'saarflex_user',
  password: process.env.DB_PASSWORD ?? 'saarflex_password',
  database: process.env.DB_NAME ?? 'saarflex_db',
  entities: [
    // Entités utilisateurs
    User, 
    Session, 
    Notification, 
    Profile, 
    PasswordReset,
    // Entités produits
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
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: true,
});