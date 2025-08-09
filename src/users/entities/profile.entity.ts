import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, unique: true })
  user_id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lieu_naissance: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  sexe: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nationalite: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  profession: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  adresse: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  numero_piece_identite: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  type_piece_identite: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  date_creation: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  date_modification: Date;
}


