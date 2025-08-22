import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProduitsTables1700000000004 implements MigrationInterface {
  name = 'CreateProduitsTables1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Table des branches de produits
    await queryRunner.query(`
      CREATE TABLE \`branches_produits\` (
        \`id\` varchar(36) NOT NULL,
        \`nom\` varchar(255) NULL,
        \`type\` enum('vie','non-vie') NULL,
        \`description\` text NULL,
        \`ordre\` int NULL DEFAULT '0',
        \`created_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_branches_type\` (\`type\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Table des produits d'assurance
    await queryRunner.query(`
      CREATE TABLE \`produits\` (
        \`id\` varchar(36) NOT NULL,
        \`nom\` varchar(255) NULL,
        \`icon\` varchar(255) NULL,
        \`type\` enum('vie','non-vie') NULL,
        \`branch_id\` varchar(36) NULL,
        \`description\` text NULL,
        \`conditions_pdf\` varchar(500) NULL,
        \`statut\` enum('actif','inactif','brouillon') NULL DEFAULT 'brouillon',
        \`created_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`created_by\` varchar(36) NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_produits_type\` (\`type\`),
        INDEX \`IDX_produits_statut\` (\`statut\`),
        INDEX \`IDX_produits_created_by\` (\`created_by\`),
        INDEX \`IDX_produits_branch_id\` (\`branch_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Table des critères de tarification
    await queryRunner.query(`
      CREATE TABLE \`criteres_tarification\` (
        \`id\` varchar(36) NOT NULL,
        \`produit_id\` varchar(36) NULL,
        \`nom\` varchar(255) NULL,
        \`type\` enum('numerique','categoriel','booleen') NULL,
        \`unite\` varchar(50) NULL,
        \`ordre\` int NULL,
        \`obligatoire\` tinyint NULL DEFAULT '1',
        \`created_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_criteres_produit_id\` (\`produit_id\`),
        INDEX \`IDX_criteres_ordre\` (\`ordre\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Table des valeurs des critères
    await queryRunner.query(`
      CREATE TABLE \`valeurs_criteres\` (
        \`id\` varchar(36) NOT NULL,
        \`critere_id\` varchar(36) NULL,
        \`valeur\` varchar(255) NULL,
        \`valeur_min\` decimal(10,2) NULL,
        \`valeur_max\` decimal(10,2) NULL,
        \`ordre\` int NULL,
        \`created_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_valeurs_critere_id\` (\`critere_id\`),
        INDEX \`IDX_valeurs_ordre\` (\`ordre\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Table des grilles tarifaires
    await queryRunner.query(`
      CREATE TABLE \`grilles_tarifaires\` (
        \`id\` varchar(36) NOT NULL,
        \`produit_id\` varchar(36) NULL,
        \`nom\` varchar(255) NULL,
        \`date_debut\` date NULL,
        \`date_fin\` date NULL,
        \`statut\` enum('actif','inactif','futur') NULL DEFAULT 'inactif',
        \`created_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`created_by\` varchar(36) NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_grilles_produit_id\` (\`produit_id\`),
        INDEX \`IDX_grilles_statut\` (\`statut\`),
        INDEX \`IDX_grilles_dates\` (\`date_debut\`, \`date_fin\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Table des tarifs
    await queryRunner.query(`
      CREATE TABLE \`tarifs\` (
        \`id\` varchar(36) NOT NULL,
        \`grille_id\` varchar(36) NULL,
        \`critere_id\` varchar(36) NULL,
        \`valeur_critere_id\` varchar(36) NULL,
        \`montant\` decimal(10,2) NULL,
        \`pourcentage\` decimal(5,2) NULL,
        \`formule\` text NULL,
        \`created_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_tarifs_grille_id\` (\`grille_id\`),
        INDEX \`IDX_tarifs_critere_id\` (\`critere_id\`),
        INDEX \`IDX_tarifs_valeur_critere_id\` (\`valeur_critere_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Table des formules de calcul
    await queryRunner.query(`
      CREATE TABLE \`formules_calcul\` (
        \`id\` varchar(36) NOT NULL,
        \`produit_id\` varchar(36) NULL,
        \`nom\` varchar(255) NULL,
        \`formule\` text NULL,
        \`variables\` json NULL,
        \`statut\` enum('actif','inactif') NULL DEFAULT 'actif',
        \`created_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_formules_produit_id\` (\`produit_id\`),
        INDEX \`IDX_formules_statut\` (\`statut\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Table des devis simulés
    await queryRunner.query(`
      CREATE TABLE \`devis_simules\` (
        \`id\` varchar(36) NOT NULL,
        \`produit_id\` varchar(36) NULL,
        \`user_id\` varchar(36) NULL,
        \`criteres\` json NULL,
        \`montant_calcul\` decimal(10,2) NULL,
        \`statut\` enum('brouillon','envoye','accepte','refuse') NULL DEFAULT 'brouillon',
        \`date_expiration\` timestamp NULL,
        \`created_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_devis_produit_id\` (\`produit_id\`),
        INDEX \`IDX_devis_user_id\` (\`user_id\`),
        INDEX \`IDX_devis_statut\` (\`statut\`),
        INDEX \`IDX_devis_date_expiration\` (\`date_expiration\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Ajout des contraintes de clés étrangères
    await queryRunner.query(`
      ALTER TABLE \`produits\` 
      ADD CONSTRAINT \`FK_produits_branch_id\` 
      FOREIGN KEY (\`branch_id\`) REFERENCES \`branches_produits\`(\`id\`) 
      ON DELETE SET NULL ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE \`criteres_tarification\` 
      ADD CONSTRAINT \`FK_criteres_produit_id\` 
      FOREIGN KEY (\`produit_id\`) REFERENCES \`produits\`(\`id\`) 
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE \`valeurs_criteres\` 
      ADD CONSTRAINT \`FK_valeurs_critere_id\` 
      FOREIGN KEY (\`critere_id\`) REFERENCES \`criteres_tarification\`(\`id\`) 
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE \`grilles_tarifaires\` 
      ADD CONSTRAINT \`FK_grilles_produit_id\` 
      FOREIGN KEY (\`produit_id\`) REFERENCES \`produits\`(\`id\`) 
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE \`tarifs\` 
      ADD CONSTRAINT \`FK_tarifs_grille_id\` 
      FOREIGN KEY (\`grille_id\`) REFERENCES \`grilles_tarifaires\`(\`id\`) 
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE \`tarifs\` 
      ADD CONSTRAINT \`FK_tarifs_critere_id\` 
      FOREIGN KEY (\`critere_id\`) REFERENCES \`criteres_tarification\`(\`id\`) 
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE \`tarifs\` 
      ADD CONSTRAINT \`FK_tarifs_valeur_critere_id\` 
      FOREIGN KEY (\`valeur_critere_id\`) REFERENCES \`valeurs_criteres\`(\`id\`) 
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE \`formules_calcul\` 
      ADD CONSTRAINT \`FK_formules_produit_id\` 
      FOREIGN KEY (\`produit_id\`) REFERENCES \`produits\`(\`id\`) 
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE \`devis_simules\` 
      ADD CONSTRAINT \`FK_devis_produit_id\` 
      FOREIGN KEY (\`produit_id\`) REFERENCES \`produits\`(\`id\`) 
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE \`devis_simules\` 
      ADD CONSTRAINT \`FK_devis_user_id\` 
      FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) 
      ON DELETE SET NULL ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Suppression des contraintes de clés étrangères dans l'ordre inverse
    await queryRunner.query(`ALTER TABLE \`devis_simules\` DROP FOREIGN KEY \`FK_devis_user_id\``);
    await queryRunner.query(`ALTER TABLE \`devis_simules\` DROP FOREIGN KEY \`FK_devis_produit_id\``);
    await queryRunner.query(`ALTER TABLE \`formules_calcul\` DROP FOREIGN KEY \`FK_formules_produit_id\``);
    await queryRunner.query(`ALTER TABLE \`tarifs\` DROP FOREIGN KEY \`FK_tarifs_valeur_critere_id\``);
    await queryRunner.query(`ALTER TABLE \`tarifs\` DROP FOREIGN KEY \`FK_tarifs_critere_id\``);
    await queryRunner.query(`ALTER TABLE \`tarifs\` DROP FOREIGN KEY \`FK_tarifs_grille_id\``);
    await queryRunner.query(`ALTER TABLE \`grilles_tarifaires\` DROP FOREIGN KEY \`FK_grilles_produit_id\``);
    await queryRunner.query(`ALTER TABLE \`valeurs_criteres\` DROP FOREIGN KEY \`FK_valeurs_critere_id\``);
    await queryRunner.query(`ALTER TABLE \`criteres_tarification\` DROP FOREIGN KEY \`FK_criteres_produit_id\``);
    await queryRunner.query(`ALTER TABLE \`produits\` DROP FOREIGN KEY \`FK_produits_branch_id\``);

    // Suppression des tables dans l'ordre inverse
    await queryRunner.query(`DROP TABLE \`devis_simules\``);
    await queryRunner.query(`DROP TABLE \`formules_calcul\``);
    await queryRunner.query(`DROP TABLE \`tarifs\``);
    await queryRunner.query(`DROP TABLE \`grilles_tarifaires\``);
    await queryRunner.query(`DROP TABLE \`valeurs_criteres\``);
    await queryRunner.query(`DROP TABLE \`criteres_tarification\``);
    await queryRunner.query(`DROP TABLE \`produits\``);
    await queryRunner.query(`DROP TABLE \`branches_produits\``);
  }
}
