import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNecessiteInfosVehiculeToProduits1734343000000 implements MigrationInterface {
    name = 'AddNecessiteInfosVehiculeToProduits1734343000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`produits\`
            ADD COLUMN \`necessite_informations_vehicule\` tinyint(1) NOT NULL DEFAULT 0
            COMMENT 'Indique si le produit nécessite les informations du véhicule'
            AFTER \`max_beneficiaires\`
        `);

        console.log('✅ Colonne necessite_informations_vehicule ajoutée à la table produits');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`produits\`
            DROP COLUMN \`necessite_informations_vehicule\`
        `);

        console.log('⏪ Colonne necessite_informations_vehicule supprimée de la table produits');
    }
}
