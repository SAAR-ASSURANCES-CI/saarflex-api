import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserType } from '../entities/user.entity';
import { SessionService } from './session.service';

/**
 * Service responsable de la gestion des utilisateurs (CRUD et recherche)
 */
@Injectable()
export class UserManagementService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly sessionService: SessionService,
    ) { }

    /**
     * Recherche un utilisateur par son ID
     * @param id ID de l'utilisateur
     * @returns User
     * @throws NotFoundException si l'utilisateur n'existe pas
     */
    async findById(id: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['notifications', 'sessions'],
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        return user;
    }

    /**
     * Recherche un utilisateur par son email
     * @param email Email de l'utilisateur
     * @returns User | null
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { email: email.toLowerCase().trim() },
        });
    }

    /**
     * Vérifie si un email existe déjà
     * @param email Email à vérifier
     * @returns boolean
     */
    async emailExists(email: string): Promise<boolean> {
        const count = await this.userRepository.count({
            where: { email: email.toLowerCase().trim() },
        });
        return count > 0;
    }

    /**
     * Vérifie si un numéro de téléphone existe déjà
     * @param telephone Numéro de téléphone à vérifier
     * @returns boolean
     */
    async phoneExists(telephone: string): Promise<boolean> {
        const count = await this.userRepository.count({
            where: { telephone: telephone.trim() },
        });
        return count > 0;
    }

    /**
     * Met à jour la date de dernière connexion de l'utilisateur
     * @param userId ID de l'utilisateur
     */
    async updateLastLogin(userId: string): Promise<void> {
        await this.userRepository.update(userId, {
            derniere_connexion: new Date(),
        });
    }

    /**
     * Désactive un utilisateur et toutes ses sessions
     * @param userId ID de l'utilisateur
     */
    async deactivateUser(userId: string): Promise<void> {
        await this.userRepository.update(userId, { statut: false });
        await this.sessionService.invalidateAllUserSessions(userId);
    }

    /**
     * Active un utilisateur
     * @param userId ID de l'utilisateur
     */
    async activateUser(userId: string): Promise<void> {
        await this.userRepository.update(userId, { statut: true });
    }

    /**
     * Récupère tous les utilisateurs (admin)
     * @returns Liste des utilisateurs
     */
    async getAllUsers(): Promise<User[]> {
        return this.userRepository.find({
            select: ['id', 'nom', 'email', 'telephone', 'type_utilisateur', 'statut', 'date_creation'],
            order: { date_creation: 'DESC' }
        });
    }

    /**
     * Compte le nombre total d'utilisateurs
     * @returns Nombre d'utilisateurs
     */
    async countUsers(): Promise<number> {
        return this.userRepository.count();
    }

    /**
     * Récupère les emails de tous les agents
     * @returns Liste des emails des agents
     */
    async findAgentsEmails(): Promise<string[]> {
        const agents = await this.userRepository.find({
            where: { type_utilisateur: UserType.AGENT, statut: true },
            select: ['email']
        });
        return agents.map(agent => agent.email);
    }
}

