import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CritereTarification } from './critere-tarification.entity';

@Entity('valeurs_criteres')
export class ValeurCritere {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  critere_id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  valeur: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valeur_min: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valeur_max: number;

  @Column({ type: 'int', nullable: false })
  ordre: number;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => CritereTarification, critere => critere.valeurs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'critere_id' })
  critere: CritereTarification;
}
