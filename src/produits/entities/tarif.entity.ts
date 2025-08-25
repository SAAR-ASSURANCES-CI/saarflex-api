import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { GrilleTarifaire } from './grille-tarifaire.entity';
import { CritereTarification } from './critere-tarification.entity';
import { ValeurCritere } from './valeur-critere.entity';

@Entity('tarifs')
export class Tarif {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  grille_id: string;

  @Column({ type: 'uuid', nullable: true })
  critere_id: string;

  @Column({ type: 'uuid', nullable: true })
  valeur_critere_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  montant: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  pourcentage: number;

  @Column({ type: 'text', nullable: true })
  formule: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  // Relations
  @ManyToOne(() => GrilleTarifaire, grille => grille.tarifs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grille_id' })
  grilleTarifaire: GrilleTarifaire;

  @ManyToOne(() => CritereTarification, critere => critere.tarifs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'critere_id' })
  critere: CritereTarification;

  @ManyToOne(() => ValeurCritere, valeurCritere => valeurCritere.tarifs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'valeur_critere_id' })
  valeurCritere: ValeurCritere;
}
