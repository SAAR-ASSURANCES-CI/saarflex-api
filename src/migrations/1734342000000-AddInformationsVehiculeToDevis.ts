import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInformationsVehiculeToDevis1734342000000 implements MigrationInterface {
    name = 'AddInformationsVehiculeToDevis1734342000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ajouter la colonne informations_vehicule dans devis_simules
        await queryRunner.query(`
            ALTER TABLE \`devis_simules\`
            ADD COLUMN \`informations_vehicule\` json NULL
            COMMENT 'Informations du véhicule pour les assurances auto (marque, modèle, immatriculation, etc.)'
            AFTER \`informations_assure\`
        `);

        console.log('✅ Colonne informations_vehicule ajoutée à la table devis_simules');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`devis_simules\`
            DROP COLUMN \`informations_vehicule\`
        `);

        console.log('⏪ Colonne informations_vehicule supprimée de la table devis_simules');
    }
}
