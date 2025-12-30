import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAvatarPathToProfiles1735550400000 implements MigrationInterface {
    name = 'AddAvatarPathToProfiles1735550400000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`profiles\` ADD \`avatar_path\` varchar(500) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`profiles\` DROP COLUMN \`avatar_path\``);
    }
}
