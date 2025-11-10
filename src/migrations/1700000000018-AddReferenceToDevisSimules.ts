import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReferenceToDevisSimules1700000000018 implements MigrationInterface {
  name = 'AddReferenceToDevisSimules1700000000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE devis_simules
      ADD COLUMN reference VARCHAR(50) NULL
    `);

    const existingDevis: Array<{ id: string; type: 'vie' | 'non-vie'; created_at: Date | string | null }> =
      await queryRunner.query(`
        SELECT 
          ds.id,
          p.type,
          ds.created_at
        FROM devis_simules ds
        INNER JOIN produits p ON p.id = ds.produit_id
        ORDER BY ds.created_at ASC, ds.id ASC
      `);

    const counters = new Map<string, number>();
    const fallbackDate = new Date();

    for (const devis of existingDevis) {
      const prefix = devis.type === 'vie' ? 'VIE' : 'NONVIE';
      const createdAt = devis.created_at ? new Date(devis.created_at) : fallbackDate;
      const formattedDate = this.formatDate(createdAt);
      const counterKey = `${prefix}-${formattedDate}`;
      const nextCounter = (counters.get(counterKey) ?? 0) + 1;
      counters.set(counterKey, nextCounter);

      const reference = `${prefix}-${formattedDate}-${nextCounter.toString().padStart(4, '0')}`;

      await queryRunner.query(
        `
          UPDATE devis_simules
          SET reference = ?
          WHERE id = ?
        `,
        [reference, devis.id],
      );
    }

    await queryRunner.query(`
      ALTER TABLE devis_simules
      MODIFY COLUMN reference VARCHAR(50) NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IDX_devis_simules_reference ON devis_simules(reference)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IDX_devis_simules_reference ON devis_simules
    `);

    await queryRunner.query(`
      ALTER TABLE devis_simules
      DROP COLUMN reference
    `);
  }

  private formatDate(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }
}


