import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDateTypeToCriteres1768224200167 implements MigrationInterface {
    name = 'AddDateTypeToCriteres1768224200167'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`criteres_tarification\` MODIFY \`type\` enum('numerique', 'categoriel', 'booleen', 'texte', 'date') NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`criteres_tarification\` MODIFY \`type\` enum('numerique', 'categoriel', 'booleen', 'texte') NOT NULL`);
    }

}
