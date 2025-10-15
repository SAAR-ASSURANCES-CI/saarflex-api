import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class UpdateDevisAndBeneficiaires1700000000012 implements MigrationInterface {
    name = 'UpdateDevisAndBeneficiaires1700000000012';

    public async up(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`
      ALTER TABLE devis_simules 
      MODIFY COLUMN statut ENUM(
        'simulation', 
        'sauvegarde', 
        'en_attente_paiement', 
        'paye', 
        'converti_en_contrat', 
        'expire'
      ) DEFAULT 'simulation'
    `);

        const indexExists = await queryRunner.query(`
      SELECT COUNT(*) as count
      FROM information_schema.statistics 
      WHERE table_schema = DATABASE()
        AND table_name = 'devis_simules'
        AND index_name = 'IDX_DEVIS_STATUT'
    `);

        if (!indexExists[0].count) {
            await queryRunner.createIndex(
                'devis_simules',
                new TableIndex({
                    name: 'IDX_DEVIS_STATUT',
                    columnNames: ['statut'],
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        const indexExists = await queryRunner.query(`
      SELECT COUNT(*) as count
      FROM information_schema.statistics 
      WHERE table_schema = DATABASE()
        AND table_name = 'devis_simules'
        AND index_name = 'IDX_DEVIS_STATUT'
    `);

        if (indexExists[0].count) {
            await queryRunner.dropIndex('devis_simules', 'IDX_DEVIS_STATUT');
        }

        await queryRunner.query(`
      ALTER TABLE devis_simules 
      MODIFY COLUMN statut ENUM('simulation', 'sauvegarde', 'expire') 
      DEFAULT 'simulation'
    `);
    }
}

