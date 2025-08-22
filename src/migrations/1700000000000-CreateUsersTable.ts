import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1700000000000 implements MigrationInterface {
    name = 'CreateUsersTable1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`sessions\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, \`token\` text NOT NULL, \`date_connexion\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`ip\` varchar(45) NULL, \`user_agent\` text NULL, \`expires_at\` timestamp NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, PRIMARY KEY (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
        await queryRunner.query(`CREATE TABLE \`notifications\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, \`titre\` varchar(255) NOT NULL, \`message\` text NOT NULL, \`lu\` tinyint NOT NULL DEFAULT 0, \`type\` varchar(100) NOT NULL DEFAULT 'general', \`date_envoi\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`nom\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`telephone\` varchar(20) NULL, \`mot_de_passe\` varchar(255) NOT NULL, \`type_utilisateur\` enum ('client', 'agent', 'drh', 'admin') NOT NULL DEFAULT 'client', \`statut\` tinyint NOT NULL DEFAULT 1, \`derniere_connexion\` datetime NULL, \`date_creation\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`date_modification\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), UNIQUE INDEX \`IDX_aacbcbfc16077f6b485951adfb\` (\`telephone\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
        await queryRunner.query(`CREATE TABLE \`password_resets\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, \`code_hash\` varchar(255) NOT NULL, \`expires_at\` timestamp NOT NULL, \`used\` tinyint NOT NULL DEFAULT 0, \`used_at\` timestamp NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
        await queryRunner.query(`ALTER TABLE \`sessions\` ADD CONSTRAINT \`FK_085d540d9f418cfbdc7bd55bb19\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`notifications\` ADD CONSTRAINT \`FK_9a8a82462cab47c73d25f49261f\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`password_resets\` ADD CONSTRAINT \`FK_passreset_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`password_resets\` DROP FOREIGN KEY \`FK_passreset_user\``);
        await queryRunner.query(`ALTER TABLE \`notifications\` DROP FOREIGN KEY \`FK_9a8a82462cab47c73d25f49261f\``);
        await queryRunner.query(`ALTER TABLE \`sessions\` DROP FOREIGN KEY \`FK_085d540d9f418cfbdc7bd55bb19\``);
        await queryRunner.query(`DROP INDEX \`IDX_aacbcbfc16077f6b485951adfb\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`password_resets\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP TABLE \`notifications\``);
        await queryRunner.query(`DROP TABLE \`sessions\``);
    }

}
