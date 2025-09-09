import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNewEntitiesForSimplifiedSystem1700000000009 implements MigrationInterface {
    name = 'CreateNewEntitiesForSimplifiedSystem1700000000009'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Détecter le type de la colonne id dans devis_simules
        const columnInfo = await queryRunner.query(`
            SELECT COLUMN_TYPE, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'devis_simules' 
            AND COLUMN_NAME = 'id'
        `);

        let idType = 'varchar(36)'; // Valeur par défaut
        if (columnInfo && columnInfo.length > 0) {
            const columnType = columnInfo[0].COLUMN_TYPE;
            idType = columnType;
        }

        // 1. Créer la table beneficiaires avec le bon type d'ID
        await queryRunner.query(`
            CREATE TABLE \`beneficiaires\` (
                \`id\` ${idType} NOT NULL,
                \`devis_simule_id\` ${idType} NOT NULL,
                \`nom_complet\` varchar(255) NOT NULL,
                \`lien_souscripteur\` varchar(100) NOT NULL,
                \`ordre\` int NOT NULL DEFAULT '1',
                \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                KEY \`FK_beneficiaires_devis_simule\` (\`devis_simule_id\`),
                CONSTRAINT \`FK_beneficiaires_devis_simule\` FOREIGN KEY (\`devis_simule_id\`) REFERENCES \`devis_simules\` (\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // 2. Créer la table documents_identite avec le bon type d'ID
        await queryRunner.query(`
            CREATE TABLE \`documents_identite\` (
                \`id\` ${idType} NOT NULL,
                \`devis_simule_id\` ${idType} NOT NULL,
                \`nom_fichier\` varchar(255) NOT NULL,
                \`chemin_fichier\` varchar(500) NOT NULL,
                \`type_document\` enum('recto', 'verso') NOT NULL,
                \`type_mime\` varchar(50) NOT NULL,
                \`taille_fichier\` int NOT NULL,
                \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                KEY \`FK_documents_identite_devis_simule\` (\`devis_simule_id\`),
                CONSTRAINT \`FK_documents_identite_devis_simule\` FOREIGN KEY (\`devis_simule_id\`) REFERENCES \`devis_simules\` (\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // 3. Ajouter les nouvelles colonnes à devis_simules
        await queryRunner.query(`
            ALTER TABLE \`devis_simules\` 
            ADD COLUMN \`informations_assure\` JSON NULL,
            ADD COLUMN \`assure_est_souscripteur\` BOOLEAN DEFAULT TRUE NOT NULL
        `);

        // 4. Ajouter les nouvelles colonnes à profiles pour les documents
        await queryRunner.query(`
            ALTER TABLE \`profiles\` 
            ADD COLUMN \`chemin_recto_piece\` VARCHAR(500) NULL,
            ADD COLUMN \`chemin_verso_piece\` VARCHAR(500) NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Supprimer les nouvelles colonnes de profiles
        await queryRunner.query(`
            ALTER TABLE \`profiles\` 
            DROP COLUMN \`chemin_recto_piece\`,
            DROP COLUMN \`chemin_verso_piece\`
        `);

        // 2. Supprimer les nouvelles colonnes de devis_simules
        await queryRunner.query(`
            ALTER TABLE \`devis_simules\` 
            DROP COLUMN \`informations_assure\`,
            DROP COLUMN \`assure_est_souscripteur\`
        `);

        // 3. Supprimer la table documents_identite
        await queryRunner.query(`DROP TABLE \`documents_identite\``);

        // 4. Supprimer la table beneficiaires
        await queryRunner.query(`DROP TABLE \`beneficiaires\``);
    }
}
