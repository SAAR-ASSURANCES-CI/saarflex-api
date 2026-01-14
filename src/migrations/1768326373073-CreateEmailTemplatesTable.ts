import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEmailTemplatesTable1768326373073 implements MigrationInterface {
    name = 'CreateEmailTemplatesTable1768326373073'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`email_templates\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`subject\` varchar(255) NOT NULL, \`content\` text NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_e832fef7d0d7dd4da2792eddbf\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`email_templates\``);
    }
}
