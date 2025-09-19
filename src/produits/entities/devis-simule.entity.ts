import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Produit } from './produit.entity';
import { GrilleTarifaire } from './grille-tarifaire.entity';
import { Beneficiaire } from './beneficiaire.entity';
import { DocumentIdentite } from './document-identite.entity';

export enum StatutDevis {
  SIMULATION = 'simulation',
  SAUVEGARDE = 'sauvegarde',
  EXPIRE = 'expire'
}

@Entity('devis_simules')
export class DevisSimule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  produit_id: string;

  @Column({ type: 'uuid', nullable: false })
  grille_tarifaire_id: string;

  @Column({ type: 'uuid', nullable: true })
  utilisateur_id: string;

  @Column({ type: 'json', nullable: false })
  criteres_utilisateur: Record<string, any>;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  prime_calculee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  franchise_calculee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  plafond_calcule: number;

  @Column({ 
    type: 'enum', 
    enum: StatutDevis, 
    default: StatutDevis.SIMULATION 
  })
  statut: StatutDevis;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nom_personnalise: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
    
  @Column({ type: 'json', nullable: true })
  informations_assure: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  assure_est_souscripteur: boolean; // true = pour moi-même, false = autre personne

  @Column({ type: 'varchar', length: 500, nullable: true })
  chemin_recto_assure: string | null; // Chemin vers la photo recto de l'assuré

  @Column({ type: 'varchar', length: 500, nullable: true })
  chemin_verso_assure: string | null; // Chemin vers la photo verso de l'assuré

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => Produit, produit => produit.devis, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'produit_id' })
  produit: Produit;

  @ManyToOne(() => GrilleTarifaire, grille => grille.tarifs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grille_tarifaire_id' })
  grilleTarifaire: GrilleTarifaire;

  @OneToMany(() => Beneficiaire, beneficiaire => beneficiaire.devisSimule, { cascade: true })
  beneficiaires: Beneficiaire[];

  @OneToMany(() => DocumentIdentite, document => document.devisSimule, { cascade: true })
  documents: DocumentIdentite[];
}
