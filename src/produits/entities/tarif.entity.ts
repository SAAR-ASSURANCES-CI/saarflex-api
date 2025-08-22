import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { GrilleTarifaire } from './grille-tarifaire.entity';

@Entity('tarifs')
export class Tarif {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  grille_tarifaire_id: string;

  @Column({ type: 'json', nullable: false })
  critere_combinaison: Record<string, any>;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  prime_base: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  franchise: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  plafond: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 1.0000 })
  coefficient_majoration: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 1.0000 })
  coefficient_reduction: number;

  @Column({ type: 'text', nullable: true })
  conditions_speciales: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => GrilleTarifaire, grille => grille.tarifs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grille_tarifaire_id' })
  grilleTarifaire: GrilleTarifaire;
}
