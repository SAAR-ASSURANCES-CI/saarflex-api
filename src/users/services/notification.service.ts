import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';

/**
 * Service responsable de la gestion des notifications utilisateur
 */
@Injectable()
export class NotificationService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
    ) {}

    /**
     * Crée une notification de bienvenue pour un nouvel utilisateur
     * @param userId ID de l'utilisateur
     */
    async createWelcomeNotification(userId: string): Promise<Notification> {
        const notification = this.notificationRepository.create({
            user_id: userId,
            titre: 'Bienvenue !',
            message: 'Votre compte a été créé avec succès. Bienvenue sur notre plateforme d\'assurance.',
            type: 'welcome',
            lu: false,
        });

        return await this.notificationRepository.save(notification);
    }

    /**
     * Crée une notification personnalisée
     * @param userId ID de l'utilisateur
     * @param titre Titre de la notification
     * @param message Message de la notification
     * @param type Type de notification
     */
    async createNotification(
        userId: string,
        titre: string,
        message: string,
        type: string = 'info'
    ): Promise<Notification> {
        const notification = this.notificationRepository.create({
            user_id: userId,
            titre,
            message,
            type,
            lu: false,
        });

        return await this.notificationRepository.save(notification);
    }

    /**
     * Marque une notification comme lue
     * @param notificationId ID de la notification
     */
    async markAsRead(notificationId: string): Promise<void> {
        await this.notificationRepository.update(notificationId, { lu: true });
    }

    /**
     * Récupère toutes les notifications d'un utilisateur
     * @param userId ID de l'utilisateur
     * @param unreadOnly Si true, retourne uniquement les non lues
     */
    async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
        const query: any = { user_id: userId };
        if (unreadOnly) {
            query.lu = false;
        }

        return await this.notificationRepository.find({
            where: query,
            order: { date_envoi: 'DESC' }
        });
    }

    /**
     * Marque toutes les notifications d'un utilisateur comme lues
     * @param userId ID de l'utilisateur
     */
    async markAllAsRead(userId: string): Promise<void> {
        await this.notificationRepository.update(
            { user_id: userId, lu: false },
            { lu: true }
        );
    }
}

