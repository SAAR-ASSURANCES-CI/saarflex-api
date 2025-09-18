import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DevisSimule } from './devis-simule.entity';

export enum TypeDocument {
  RECTO = 'recto',
  VERSO = 'verso'
}

@Entity('documents_identite')
export class DocumentIdentite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  devis_simule_id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  nom_fichier: string;

  @Column({ type: 'varchar', length: 500, nullable: false })
  chemin_fichier: string;

  @Column({ 
    type: 'enum', 
    enum: TypeDocument, 
    nullable: false 
  })
  type_document: TypeDocument;

  @Column({ type: 'varchar', length: 50, nullable: false })
  type_mime: string;

  @Column({ type: 'int', nullable: false })
  taille_fichier: number;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => DevisSimule, devis => devis.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'devis_simule_id' })
  devisSimule: DevisSimule;
}
