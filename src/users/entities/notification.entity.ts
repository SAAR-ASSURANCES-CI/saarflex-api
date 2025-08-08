import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @Column({ type: 'varchar', length: 255 })
    titre: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ type: 'boolean', default: false })
    lu: boolean;

    @Column({ type: 'varchar', length: 100, default: 'general' })
    type: string;

    @CreateDateColumn({ type: 'timestamp' })
    date_envoi: Date;

    @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}