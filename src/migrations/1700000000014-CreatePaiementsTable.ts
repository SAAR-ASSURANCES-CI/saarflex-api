import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaiementsTable1700000000014 implements MigrationInterface {
  name = 'CreatePaiementsTable1700000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Détecter le type de la colonne id dans devis_simules
    const devisColumnInfo = await queryRunner.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'devis_simules' 
      AND COLUMN_NAME = 'id'
    `);

    const devisIdType = devisColumnInfo[0]?.COLUMN_TYPE || 'varchar(36)';

    // Détecter le type de la colonne id dans contrats
    const contratColumnInfo = await queryRunner.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'contrats' 
      AND COLUMN_NAME = 'id'
    `);

    const contratIdType = contratColumnInfo[0]?.COLUMN_TYPE || 'varchar(36)';

    // Créer la table paiements
    await queryRunner.query(`
      CREATE TABLE \`paiements\` (
        \`id\` ${devisIdType} NOT NULL,
        \`reference_paiement\` varchar(100) NOT NULL,
        \`devis_simule_id\` ${devisIdType} NOT NULL,
        \`contrat_id\` ${contratIdType} NULL,
        \`utilisateur_id\` varchar(36) NOT NULL,
        \`montant\` decimal(10,2) NOT NULL,
        \`methode_paiement\` enum('wave','orange_money','carte_bancaire','virement','especes') NOT NULL,
        \`statut\` enum('en_attente','reussi','echoue','rembourse','annule') DEFAULT 'en_attente',
        \`reference_externe\` varchar(255) NULL,
        \`numero_telephone\` varchar(50) NULL,
        \`donnees_callback\` json NULL,
        \`message_erreur\` varchar(500) NULL,
        \`date_paiement\` timestamp NULL,
        \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UK_PAIEMENT_REFERENCE\` (\`reference_paiement\`),
        KEY \`IDX_PAIEMENTS_UTILISATEUR\` (\`utilisateur_id\`),
        KEY \`IDX_PAIEMENTS_DEVIS\` (\`devis_simule_id\`),
        KEY \`IDX_PAIEMENTS_CONTRAT\` (\`contrat_id\`),
        KEY \`IDX_PAIEMENTS_STATUT\` (\`statut\`),
        KEY \`IDX_PAIEMENTS_METHODE\` (\`methode_paiement\`),
        KEY \`IDX_PAIEMENTS_DATE\` (\`date_paiement\`),
        CONSTRAINT \`FK_paiements_devis_simule\` FOREIGN KEY (\`devis_simule_id\`) REFERENCES \`devis_simules\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_paiements_contrat\` FOREIGN KEY (\`contrat_id\`) REFERENCES \`contrats\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`paiements\``);
  }
}
