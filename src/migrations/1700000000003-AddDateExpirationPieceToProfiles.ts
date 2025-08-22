import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDateExpirationPieceToProfiles1700000000003 implements MigrationInterface {
  name = 'AddDateExpirationPieceToProfiles1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`profiles\` ADD \`date_expiration_piece_identite\` date NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`profiles\` DROP COLUMN \`date_expiration_piece_identite\``);
  }
}
