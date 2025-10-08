import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../entities/session.entity';

/**
 * Service responsable de la gestion des sessions utilisateur
 */
@Injectable()
export class SessionService {
    constructor(
        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,
    ) {}

    /**
     * Crée une nouvelle session utilisateur
     * @param userId ID de l'utilisateur
     * @param token Token JWT
     * @param ipAddress Adresse IP optionnelle
     * @param userAgent User agent optionnel
     * @returns Session créée
     */
    async createSession(
        userId: string,
        token: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<Session> {
        const session = this.sessionRepository.create({
            user_id: userId,
            token: token,
            ip: ipAddress,
            user_agent: userAgent,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 heures
            is_active: true,
        });

        return await this.sessionRepository.save(session);
    }

    /**
     * Invalide une session spécifique
     * @param sessionId ID de la session
     */
    async invalidateSession(sessionId: string): Promise<void> {
        await this.sessionRepository.update(sessionId, { is_active: false });
    }

    /**
     * Invalide toutes les sessions d'un utilisateur
     * @param userId ID de l'utilisateur
     */
    async invalidateAllUserSessions(userId: string): Promise<void> {
        await this.sessionRepository.update(
            { user_id: userId },
            { is_active: false }
        );
    }

    /**
     * Vérifie si une session est active
     * @param sessionId ID de la session
     * @returns boolean
     */
    async isSessionActive(sessionId: string): Promise<boolean> {
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId, is_active: true }
        });
        
        if (!session) return false;
        
        if (session.expires_at < new Date()) {
            await this.invalidateSession(sessionId);
            return false;
        }
        
        return true;
    }

    /**
     * Nettoie les sessions expirées (méthode utilitaire)
     */
    async cleanExpiredSessions(): Promise<number> {
        const result = await this.sessionRepository
            .createQueryBuilder()
            .update(Session)
            .set({ is_active: false })
            .where('expires_at < :now', { now: new Date() })
            .andWhere('is_active = :active', { active: true })
            .execute();

        return result.affected || 0;
    }
}

