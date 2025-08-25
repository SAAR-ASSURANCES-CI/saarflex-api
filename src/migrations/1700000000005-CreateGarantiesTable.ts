import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGarantiesTable1700000000005 implements MigrationInterface {
  name = 'CreateGarantiesTable1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`garanties\` (
        \`id\` varchar(36) NOT NULL,
        \`nom\` varchar(255) NOT NULL,
        \`description\` text NULL,
        \`type\` enum('obligatoire','optionnelle') NOT NULL DEFAULT 'obligatoire',
        \`montant_garanti\` decimal(15,2) NULL,
        \`franchise\` decimal(15,2) NULL DEFAULT '0.00',
        \`ordre\` int NOT NULL DEFAULT '0',
        \`produit_id\` varchar(36) NOT NULL,
        \`statut\` enum('active','inactive') NOT NULL DEFAULT 'active',
        \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`created_by\` varchar(36) NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_garanties_produit_id\` (\`produit_id\`),
        INDEX \`IDX_garanties_type\` (\`type\`),
        INDEX \`IDX_garanties_statut\` (\`statut\`),
        INDEX \`IDX_garanties_ordre\` (\`ordre\`),
        INDEX \`IDX_garanties_created_by\` (\`created_by\`),
        CONSTRAINT \`FK_garanties_produit_id\` FOREIGN KEY (\`produit_id\`) REFERENCES \`produits\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_garanties_created_by\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`garanties_criteres\` (
        \`id\` varchar(36) NOT NULL,
        \`garantie_id\` varchar(36) NOT NULL,
        \`critere_id\` varchar(36) NOT NULL,
        \`valeur_requise\` varchar(255) NULL,
        \`valeur_min_requise\` decimal(10,2) NULL,
        \`valeur_max_requise\` decimal(10,2) NULL,
        \`operateur\` enum('egal','different','superieur','inferieur','entre','hors') NOT NULL DEFAULT 'egal',
        \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UK_garantie_critere\` (\`garantie_id\`, \`critere_id\`),
        INDEX \`IDX_garanties_criteres_garantie_id\` (\`garantie_id\`),
        INDEX \`IDX_garanties_criteres_critere_id\` (\`critere_id\`),
        CONSTRAINT \`FK_garanties_criteres_garantie_id\` FOREIGN KEY (\`garantie_id\`) REFERENCES \`garanties\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_garanties_criteres_critere_id\` FOREIGN KEY (\`critere_id\`) REFERENCES \`criteres_tarification\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`tarifs_garanties\` (
        \`id\` varchar(36) NOT NULL,
        \`garantie_id\` varchar(36) NOT NULL,
        \`montant_base\` decimal(15,2) NOT NULL,
        \`pourcentage_produit\` decimal(5,2) NULL,
        \`formule_calcul\` text NULL,
        \`date_debut\` date NOT NULL,
        \`date_fin\` date NULL,
        \`statut\` enum('actif','inactif','futur') NOT NULL DEFAULT 'actif',
        \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`created_by\` varchar(36) NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_tarifs_garanties_garantie_id\` (\`garantie_id\`),
        INDEX \`IDX_tarifs_garanties_statut\` (\`statut\`),
        INDEX \`IDX_tarifs_garanties_dates\` (\`date_debut\`, \`date_fin\`),
        INDEX \`IDX_tarifs_garanties_created_by\` (\`created_by\`),
        CONSTRAINT \`FK_tarifs_garanties_garantie_id\` FOREIGN KEY (\`garantie_id\`) REFERENCES \`garanties\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_tarifs_garanties_created_by\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`tarifs_garanties\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`garanties_criteres\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`garanties\``);
  }
}
