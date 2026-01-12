import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Produit } from './produit.entity';
import { ValeurCritere } from './valeur-critere.entity';
import { GarantieCritere } from './garantie-critere.entity';
import { Tarif } from './tarif.entity';

export enum TypeCritere {
  NUMERIQUE = 'numerique',
  CATEGORIEL = 'categoriel',
  BOOLEEN = 'booleen',
  TEXTE = 'texte'
}

@Entity('criteres_tarification')
export class CritereTarification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  produit_id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  nom: string;

  @Column({
    type: 'enum',
    enum: TypeCritere,
    nullable: false
  })
  type: TypeCritere;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unite: string;

  @Column({ type: 'int', nullable: false })
  ordre: number;

  @Column({ type: 'boolean', default: true })
  obligatoire: boolean;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => Produit, produit => produit.criteres, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'produit_id' })
  produit: Produit;

  @OneToMany(() => ValeurCritere, valeur => valeur.critere, { cascade: true })
  valeurs: ValeurCritere[];

  @OneToMany(() => Tarif, tarif => tarif.critere, { cascade: true })
  tarifs: Tarif[];
}
