import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomFieldsToDevisSimules1700000000006 implements MigrationInterface {
  name = 'AddCustomFieldsToDevisSimules1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE devis_simules 
      ADD COLUMN nom_personnalise VARCHAR(255) NULL,
      ADD COLUMN notes TEXT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE devis_simules 
      DROP COLUMN nom_personnalise,
      DROP COLUMN notes
    `);
  }
}
