import { MigrationInterface, QueryRunner } from 'typeorm';

export class RecreateBeneficiairesForContratsOnly1700000000015 implements MigrationInterface {
  name = 'RecreateBeneficiairesForContratsOnly1700000000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const contratColumnInfo = await queryRunner.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'contrats' 
      AND COLUMN_NAME = 'id'
    `);

    const contratIdType = contratColumnInfo[0]?.COLUMN_TYPE || 'varchar(36)';

    await queryRunner.query(`DROP TABLE IF EXISTS \`beneficiaires\``);

    await queryRunner.query(`
      CREATE TABLE \`beneficiaires\` (
        \`id\` ${contratIdType} NOT NULL,
        \`contrat_id\` ${contratIdType} NOT NULL,
        \`nom_complet\` varchar(255) NOT NULL,
        \`lien_souscripteur\` varchar(100) NOT NULL,
        \`ordre\` int DEFAULT 1 NOT NULL,
        \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`IDX_BENEFICIAIRES_CONTRAT\` (\`contrat_id\`),
        CONSTRAINT \`FK_beneficiaires_contrat\` FOREIGN KEY (\`contrat_id\`) REFERENCES \`contrats\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {

    const devisColumnInfo = await queryRunner.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'devis_simules' 
      AND COLUMN_NAME = 'id'
    `);

    const devisIdType = devisColumnInfo[0]?.COLUMN_TYPE || 'varchar(36)';

    await queryRunner.query(`DROP TABLE IF EXISTS \`beneficiaires\``);

    await queryRunner.query(`
      CREATE TABLE \`beneficiaires\` (
        \`id\` ${devisIdType} NOT NULL,
        \`devis_simule_id\` ${devisIdType} NOT NULL,
        \`nom_complet\` varchar(255) NOT NULL,
        \`lien_souscripteur\` varchar(100) NOT NULL,
        \`ordre\` int DEFAULT 1 NOT NULL,
        \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`FK_beneficiaires_devis_simule\` (\`devis_simule_id\`),
        CONSTRAINT \`FK_beneficiaires_devis_simule\` FOREIGN KEY (\`devis_simule_id\`) REFERENCES \`devis_simules\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }
}
