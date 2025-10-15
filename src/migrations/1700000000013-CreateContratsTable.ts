import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class CreateContratsTable1700000000013 implements MigrationInterface {
    name = 'CreateContratsTable1700000000013';

    public async up(queryRunner: QueryRunner): Promise<void> {

        const columnInfo = await queryRunner.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'devis_simules' 
      AND COLUMN_NAME = 'id'
    `);

        const idType = columnInfo[0]?.COLUMN_TYPE || 'varchar(36)';

        // Détecter le type de la colonne id dans produits
        const produitColumnInfo = await queryRunner.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'produits' 
      AND COLUMN_NAME = 'id'
    `);

        const produitIdType = produitColumnInfo[0]?.COLUMN_TYPE || 'varchar(36)';

        // Détecter le type de la colonne id dans grilles_tarifaires
        const grilleColumnInfo = await queryRunner.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'grilles_tarifaires' 
      AND COLUMN_NAME = 'id'
    `);

        const grilleIdType = grilleColumnInfo[0]?.COLUMN_TYPE || 'varchar(36)';

        // Créer la table contrats avec les bons types
        await queryRunner.query(`
      CREATE TABLE \`contrats\` (
        \`id\` ${idType} NOT NULL,
        \`numero_contrat\` varchar(50) NOT NULL,
        \`devis_simule_id\` ${idType} NOT NULL,
        \`produit_id\` ${produitIdType} NOT NULL,
        \`grille_tarifaire_id\` ${grilleIdType} NOT NULL,
        \`utilisateur_id\` varchar(36) NOT NULL,
        \`criteres_utilisateur\` json NOT NULL,
        \`prime_mensuelle\` decimal(10,2) NOT NULL,
        \`franchise\` decimal(10,2) DEFAULT 0,
        \`plafond\` decimal(10,2) NULL,
        \`periodicite_paiement\` enum('mensuel','annuel') DEFAULT 'mensuel',
        \`duree_couverture\` int DEFAULT 12,
        \`date_debut_couverture\` timestamp NOT NULL,
        \`date_fin_couverture\` timestamp NOT NULL,
        \`statut\` enum('actif','suspendu','resilie','expire') DEFAULT 'actif',
        \`informations_assure\` json NULL,
        \`assure_est_souscripteur\` boolean DEFAULT true,
        \`chemin_recto_assure\` varchar(500) NULL,
        \`chemin_verso_assure\` varchar(500) NULL,
        \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UK_CONTRAT_NUMERO\` (\`numero_contrat\`),
        KEY \`IDX_CONTRATS_UTILISATEUR\` (\`utilisateur_id\`),
        KEY \`IDX_CONTRATS_DEVIS\` (\`devis_simule_id\`),
        KEY \`IDX_CONTRATS_PRODUIT\` (\`produit_id\`),
        KEY \`IDX_CONTRATS_STATUT\` (\`statut\`),
        KEY \`IDX_CONTRATS_DATE_FIN\` (\`date_fin_couverture\`),
        CONSTRAINT \`FK_contrats_devis_simule\` FOREIGN KEY (\`devis_simule_id\`) REFERENCES \`devis_simules\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_contrats_produit\` FOREIGN KEY (\`produit_id\`) REFERENCES \`produits\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_contrats_grille_tarifaire\` FOREIGN KEY (\`grille_tarifaire_id\`) REFERENCES \`grilles_tarifaires\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`contrats\``);
    }
}
