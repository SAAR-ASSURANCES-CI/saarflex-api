import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration de nettoyage pour supprimer l'ancienne entrée de migration
 * et permettre la nouvelle migration de s'exécuter correctement
 */
export class CleanupOldCategorieMigration1700000000019 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Supprimer l'ancienne entrée de migration
        await queryRunner.query(`
            DELETE FROM migrations 
            WHERE name = 'CreateCategorieProduitTable1764001559695'
        `);
        console.log('✅ Ancienne migration CreateCategorieProduitTable1764001559695 supprimée');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rien à faire pour le rollback
    }
}
