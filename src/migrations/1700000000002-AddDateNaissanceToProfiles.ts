import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDateNaissanceToProfiles1700000000002 implements MigrationInterface {
  name = 'AddDateNaissanceToProfiles1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`profiles\` ADD \`date_naissance\` date NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`profiles\` DROP COLUMN \`date_naissance\``);
  }
}

 

