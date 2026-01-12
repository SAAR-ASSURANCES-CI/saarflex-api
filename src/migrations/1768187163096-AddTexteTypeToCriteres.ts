import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTexteTypeToCriteres1768187163096 implements MigrationInterface {
    name = 'AddTexteTypeToCriteres1768187163096'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`criteres_tarification\` CHANGE \`type\` \`type\` enum ('numerique', 'categoriel', 'booleen', 'texte') NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`criteres_tarification\` CHANGE \`type\` \`type\` enum ('numerique', 'categoriel', 'booleen') NOT NULL`);
    }

}
