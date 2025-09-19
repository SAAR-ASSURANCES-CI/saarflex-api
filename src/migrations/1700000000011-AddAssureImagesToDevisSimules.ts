import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAssureImagesToDevisSimules1700000000011 implements MigrationInterface {
  name = 'AddAssureImagesToDevisSimules1700000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('devis_simules', [
      new TableColumn({
        name: 'chemin_recto_assure',
        type: 'varchar',
        length: '500',
        isNullable: true,
        comment: 'Chemin vers la photo recto de l\'assuré'
      }),
      new TableColumn({
        name: 'chemin_verso_assure',
        type: 'varchar',
        length: '500',
        isNullable: true,
        comment: 'Chemin vers la photo verso de l\'assuré'
      })
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('devis_simules', [
      'chemin_recto_assure',
      'chemin_verso_assure'
    ]);
  }
}
