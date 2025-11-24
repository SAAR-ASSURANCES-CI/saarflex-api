import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class CreateAdminUser1700000000019 implements MigrationInterface {
    public name = 'CreateAdminUser1700000000019';

    public async up(queryRunner: QueryRunner): Promise<void> {
       const email = 'admin@saarassurancesci.com';
       const password = 'SaarCI@2025#';

       const salt = await bcrypt.genSalt();
       const hashedPassword = await bcrypt.hash(password, salt);

       const sql = `
            INSERT INTO users (id, nom, email,  mot_de_passe, type_utilisateur, statut, premiere_connexion, mot_de_passe_temporaire, date_creation, date_modification)
            VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Administrateur', '${email}', '${hashedPassword}', 'admin', '1', false, false, NOW(), NOW())
        `;

        await queryRunner.query(sql);

        console.log('Admin user created successfully');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
       const sql = `
            DELETE FROM users WHERE email = 'admin@saarassurancesci.com'
        `;

        await queryRunner.query(sql);

        console.log('Admin user deleted successfully');
    }
}
