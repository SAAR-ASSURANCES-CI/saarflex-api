import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDateExpirationPieceToProfiles1754667171904 implements MigrationInterface {
  name = 'AddDateExpirationPieceToProfiles1754667171904';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`profiles\` ADD \`date_expiration_piece_identite\` date NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`profiles\` DROP COLUMN \`date_expiration_piece_identite\``);
  }
}
