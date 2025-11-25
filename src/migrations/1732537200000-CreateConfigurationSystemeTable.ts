import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConfigurationSystemeTable1732537200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Créer la table configuration_systeme
        await queryRunner.query(`
            CREATE TABLE \`configuration_systeme\` (
                \`id\` varchar(36) NOT NULL,
                \`cle\` varchar(100) NOT NULL,
                \`valeur\` text NOT NULL,
                \`description\` varchar(255) NULL,
                \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`UK_CONFIG_CLE\` (\`cle\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Insérer la configuration par défaut pour le code agence
        await queryRunner.query(`
            INSERT INTO \`configuration_systeme\` (\`id\`, \`cle\`, \`valeur\`, \`description\`)
            VALUES (
                UUID(),
                'code_agence',
                '101',
                'Code agence/intermédiaire utilisé pour générer les numéros de police'
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`configuration_systeme\``);
    }
}
