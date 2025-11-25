import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Entité pour stocker les configurations globales du système
 */
@Entity('configuration_systeme')
export class ConfigurationSysteme {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
    cle: string; // Clé de configuration (ex: 'code_agence')

    @Column({ type: 'text', nullable: false })
    valeur: string; // Valeur de la configuration

    @Column({ type: 'varchar', length: 255, nullable: true })
    description: string; // Description de la configuration

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
