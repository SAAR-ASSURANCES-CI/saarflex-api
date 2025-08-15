import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDateNaissanceToProfiles1754667171903 implements MigrationInterface {
  name = 'AddDateNaissanceToProfiles1754667171903';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`profiles\` ADD \`date_naissance\` date NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`profiles\` DROP COLUMN \`date_naissance\``);
  }
}

 

