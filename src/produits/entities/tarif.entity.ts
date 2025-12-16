import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { GrilleTarifaire } from './grille-tarifaire.entity';
import { CritereTarification } from './critere-tarification.entity';
import { ValeurCritere } from './valeur-critere.entity';

export enum TypeCalculTarif {
  MONTANT_FIXE = 'montant_fixe',
  POURCENTAGE_VALEUR_NEUVE = 'pourcentage_valeur_neuve',
  POURCENTAGE_VALEUR_VENALE = 'pourcentage_valeur_venale',
  FORMULE_PERSONNALISEE = 'formule_personnalisee'
}

@Entity('tarifs')
export class Tarif {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  grille_id: string;

  @Column({
    type: 'enum',
    enum: TypeCalculTarif,
    default: TypeCalculTarif.MONTANT_FIXE,
    comment: 'Type de calcul du tarif'
  })
  type_calcul: TypeCalculTarif;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'Taux de pourcentage pour calcul sur VN ou VV (ex: 3.5 pour 3.5%)'
  })
  taux_pourcentage: number;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Formule de calcul personnalisée'
  })
  formule_calcul: string;

  @Column({ type: 'uuid', nullable: true })
  critere_id: string;

  @Column({ type: 'uuid', nullable: true })
  valeur_critere_id: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Montant fixe en FCFA (utilisé si type_calcul = montant_fixe)'
  })
  montant_fixe: number;

  @Column({ type: 'json', nullable: true })
  criteres_combines: Record<string, string>;

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
