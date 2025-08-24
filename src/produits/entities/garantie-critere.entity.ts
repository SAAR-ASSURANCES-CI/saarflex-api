import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique
} from 'typeorm';
import { Garantie } from './garantie.entity';
import { CritereTarification } from './critere-tarification.entity';

export enum OperateurCritere {
  EGAL = 'egal',
  DIFFERENT = 'different',
  SUPERIEUR = 'superieur',
  INFERIEUR = 'inferieur',
  ENTRE = 'entre',
  HORS = 'hors'
}

@Entity('garanties_criteres')
@Index(['garantie_id'])
@Index(['critere_id'])
@Unique(['garantie_id', 'critere_id'])
export class GarantieCritere {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, nullable: false })
  garantie_id: string;

  @Column({ type: 'varchar', length: 36, nullable: false })
  critere_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  valeur_requise: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Valeur minimale requise pour activer la garantie'
  })
  valeur_min_requise: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Valeur maximale requise pour activer la garantie'
  })
  valeur_max_requise: number;

  @Column({
    type: 'enum',
    enum: OperateurCritere,
    default: OperateurCritere.EGAL
  })
  operateur: OperateurCritere;

  @CreateDateColumn({ type: 'timestamp', precision: 6 })
  created_at: Date;

  // Relations
  @ManyToOne(() => Garantie, garantie => garantie.garanties_criteres, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'garantie_id' })
  garantie: Garantie;

  @ManyToOne(() => CritereTarification, critere => critere.garanties_criteres, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'critere_id' })
  critere: CritereTarification;
}
