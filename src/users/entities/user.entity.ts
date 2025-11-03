import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany
} from "typeorm";
import { Session } from "./session.entity";
import { Notification } from "./notification.entity";

export enum UserType {
    CLIENT = 'client',
    AGENT = 'agent',
    DRH = 'drh',
    ADMIN = 'admin',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    nom: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
    telephone: string | null;

    @Column({ type: 'varchar', length: 255 })
    mot_de_passe: string;

    @Column({
        type: 'enum',
        enum: UserType,
        default: UserType.CLIENT,
    })
    type_utilisateur: UserType;

    @Column({ type: 'boolean', default: true })
    statut: boolean;

    @Column({ type: 'boolean', default: true })
    premiere_connexion: boolean;

    @Column({ type: 'boolean', default: false })
    mot_de_passe_temporaire: boolean;

    @Column({ type: 'datetime', nullable: true })
    derniere_connexion: Date;

    @CreateDateColumn({ type: 'timestamp' })
    date_creation: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    date_modification: Date;

    @OneToMany(() => Session, (session) => session.user, { cascade: true })
    sessions: Session[];

    @OneToMany(() => Notification, (notification) => notification.user, {
        cascade: true,
    })
    notifications: Notification[];
}