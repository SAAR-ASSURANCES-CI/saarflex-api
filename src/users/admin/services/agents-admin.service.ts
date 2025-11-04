import {
    Injectable,
    ConflictException,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserType } from '../../entities/user.entity';
import { CreateAgentDto, UpdateAgentDto, AgentResponseDto, AgentsResponseDto } from '../dto/agent-admin.dto';
import { EmailService } from '../../email/email.service';
import { UserManagementService } from '../../services/user-management.service';
import { SessionService } from '../../services/session.service';

/**
 * Service responsable de la gestion des agents par les administrateurs
 */
@Injectable()
export class AgentsAdminService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly emailService: EmailService,
        private readonly userManagementService: UserManagementService,
        private readonly sessionService: SessionService,
    ) {}

    /**
     * Génère un mot de passe sécurisé aléatoire
     * @returns Mot de passe généré
     * @private
     */
    private generateSecurePassword(): string {
        const length = 12;
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        const allChars = lowercase + uppercase + numbers + special;

        // Garantir au moins un caractère de chaque type
        let password = '';
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += special[Math.floor(Math.random() * special.length)];

        // Compléter avec des caractères aléatoires
        for (let i = password.length; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }

        // Mélanger les caractères
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }

    /**
     * Crée un nouvel utilisateur (admin ou agent) avec mot de passe généré
     * @param createAgentDto Données de création
     * @returns AgentResponseDto
     */
    async createAgent(createAgentDto: CreateAgentDto): Promise<AgentResponseDto> {
        try {
            // Vérifier que le type est admin ou agent (pas client)
            if (createAgentDto.type_utilisateur === UserType.CLIENT) {
                throw new BadRequestException('Le type utilisateur ne peut pas être client');
            }

            const existingUser = await this.userManagementService.findByEmail(createAgentDto.email);
            if (existingUser) {
                throw new ConflictException('Un utilisateur avec cet email existe déjà');
            }

            if (createAgentDto.telephone) {
                const existingPhone = await this.userManagementService.phoneExists(createAgentDto.telephone);
                if (existingPhone) {
                    throw new ConflictException('Un utilisateur avec ce numéro de téléphone existe déjà');
                }
            }

            const tempPassword = this.generateSecurePassword();
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

            const newUser = this.userRepository.create({
                nom: createAgentDto.nom.trim(),
                email: createAgentDto.email.toLowerCase().trim(),
                telephone: createAgentDto.telephone?.trim() || null,
                mot_de_passe: hashedPassword,
                type_utilisateur: createAgentDto.type_utilisateur,
                statut: true,
                premiere_connexion: true,
                mot_de_passe_temporaire: true,
            });

            const savedUser = await this.userRepository.save(newUser);

            this.emailService.sendAgentCredentials(
                savedUser.nom,
                savedUser.email,
                tempPassword
            ).catch(error => {
                console.error(`[AgentsAdminService] Erreur lors de l'envoi de l'email à ${savedUser.email}:`, error);
            });

            return this.mapToAgentResponseDto(savedUser);
        } catch (error) {
            if (error instanceof ConflictException || error instanceof BadRequestException) {
                throw error;
            }
            console.error('[AgentsAdminService] Erreur lors de la création de l\'utilisateur:', error);
            throw new InternalServerErrorException('Erreur lors de la création de l\'utilisateur');
        }
    }

    /**
     * Récupère tous les utilisateurs (admin et agent) avec pagination, filtres et recherche
     * @param page Numéro de page
     * @param limit Nombre d'éléments par page
     * @param type_utilisateur Filtre par type (admin, agent, ou undefined pour tous)
     * @param statut Filtre par statut (true, false, ou undefined pour tous)
     * @param search Recherche par nom ou email
     * @returns AgentsResponseDto
     */
    async getAllAgents(
        page: number = 1,
        limit: number = 10,
        type_utilisateur?: UserType,
        statut?: boolean,
        search?: string,
    ): Promise<AgentsResponseDto> {
        const skip = (page - 1) * limit;

        // Construire les conditions de recherche
        const where: any = {};
        
        // Filtrer par type (exclure les clients)
        if (type_utilisateur) {
            where.type_utilisateur = type_utilisateur;
        } else {
            // Par défaut, exclure les clients
            where.type_utilisateur = [UserType.ADMIN, UserType.AGENT];
        }

        // Filtrer par statut
        if (statut !== undefined) {
            where.statut = statut;
        }

        // Recherche par nom ou email
        const queryBuilder = this.userRepository.createQueryBuilder('user')
            .select([
                'user.id',
                'user.nom',
                'user.email',
                'user.telephone',
                'user.type_utilisateur',
                'user.statut',
                'user.premiere_connexion',
                'user.date_creation',
                'user.date_modification',
                'user.derniere_connexion',
            ])
            .where('user.type_utilisateur IN (:...types)', { types: type_utilisateur ? [type_utilisateur] : [UserType.ADMIN, UserType.AGENT] });

        if (statut !== undefined) {
            queryBuilder.andWhere('user.statut = :statut', { statut });
        }

        if (search && search.trim()) {
            const searchTerm = `%${search.trim()}%`;
            queryBuilder.andWhere(
                '(user.nom LIKE :search OR user.email LIKE :search)',
                { search: searchTerm }
            );
        }

        queryBuilder.orderBy('user.date_creation', 'DESC')
            .skip(skip)
            .take(limit);

        const [agents, total] = await queryBuilder.getManyAndCount();

        return {
            agents: agents.map(agent => this.mapToAgentResponseDto(agent)),
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit),
        };
    }

    /**
     * Récupère un utilisateur par son ID (admin ou agent uniquement)
     * @param id ID de l'utilisateur
     * @returns AgentResponseDto
     * @throws NotFoundException si l'utilisateur n'existe pas ou est un client
     */
    async getAgentById(id: string): Promise<AgentResponseDto> {
        const user = await this.userRepository.findOne({
            where: { id },
            select: ['id', 'nom', 'email', 'telephone', 'type_utilisateur', 'statut', 'premiere_connexion', 'date_creation', 'date_modification', 'derniere_connexion'],
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        if (user.type_utilisateur === UserType.CLIENT) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        return this.mapToAgentResponseDto(user);
    }

    /**
     * Met à jour un utilisateur (admin ou agent)
     * @param id ID de l'utilisateur
     * @param updateAgentDto Données de mise à jour
     * @returns AgentResponseDto
     */
    async updateAgent(id: string, updateAgentDto: UpdateAgentDto): Promise<AgentResponseDto> {
        const user = await this.userRepository.findOne({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        if (user.type_utilisateur === UserType.CLIENT) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        if (updateAgentDto.email && updateAgentDto.email !== user.email) {
            const existingUser = await this.userManagementService.findByEmail(updateAgentDto.email);
            if (existingUser && existingUser.id !== id) {
                throw new ConflictException('Un utilisateur avec cet email existe déjà');
            }
        }

        if (updateAgentDto.telephone && updateAgentDto.telephone !== user.telephone) {
            const existingPhone = await this.userManagementService.phoneExists(updateAgentDto.telephone);
            if (existingPhone) {
                const phoneUser = await this.userRepository.findOne({
                    where: { telephone: updateAgentDto.telephone },
                });
                if (phoneUser && phoneUser.id !== id) {
                    throw new ConflictException('Un utilisateur avec ce numéro de téléphone existe déjà');
                }
            }
        }

        if (updateAgentDto.nom) {
            user.nom = updateAgentDto.nom.trim();
        }
        if (updateAgentDto.email) {
            user.email = updateAgentDto.email.toLowerCase().trim();
        }
        if (updateAgentDto.telephone !== undefined) {
            user.telephone = updateAgentDto.telephone?.trim() || null;
        }

        const updatedUser = await this.userRepository.save(user);
        return this.mapToAgentResponseDto(updatedUser);
    }

    /**
     * Suspend un utilisateur (désactive son compte et invalide ses sessions)
     * @param id ID de l'utilisateur
     * @returns AgentResponseDto
     */
    async suspendAgent(id: string): Promise<AgentResponseDto> {
        const user = await this.userRepository.findOne({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        if (user.type_utilisateur === UserType.CLIENT) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        if (!user.statut) {
            throw new BadRequestException('L\'utilisateur est déjà suspendu');
        }

        await this.userManagementService.deactivateUser(id);
        await this.sessionService.invalidateAllUserSessions(id);

        const suspendedUser = await this.userRepository.findOne({
            where: { id },
            select: ['id', 'nom', 'email', 'telephone', 'type_utilisateur', 'statut', 'premiere_connexion', 'date_creation', 'date_modification', 'derniere_connexion'],
        });

        return this.mapToAgentResponseDto(suspendedUser!);
    }

    /**
     * Réactive un utilisateur
     * @param id ID de l'utilisateur
     * @returns AgentResponseDto
     */
    async activateAgent(id: string): Promise<AgentResponseDto> {
        const user = await this.userRepository.findOne({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        if (user.type_utilisateur === UserType.CLIENT) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        if (user.statut) {
            throw new BadRequestException('L\'utilisateur est déjà actif');
        }

        await this.userManagementService.activateUser(id);

        const activatedUser = await this.userRepository.findOne({
            where: { id },
            select: ['id', 'nom', 'email', 'telephone', 'type_utilisateur', 'statut', 'premiere_connexion', 'date_creation', 'date_modification', 'derniere_connexion'],
        });

        return this.mapToAgentResponseDto(activatedUser!);
    }

    /**
     * Réinitialise le mot de passe d'un utilisateur (admin-initiated)
     * @param id ID de l'utilisateur
     * @returns AgentResponseDto
     */
    async resetAgentPassword(id: string): Promise<AgentResponseDto> {
        const user = await this.userRepository.findOne({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        if (user.type_utilisateur === UserType.CLIENT) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        const tempPassword = this.generateSecurePassword();
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

        user.mot_de_passe = hashedPassword;
        user.premiere_connexion = true;
        user.mot_de_passe_temporaire = true;

        await this.userRepository.save(user);

        await this.sessionService.invalidateAllUserSessions(id);

        this.emailService.sendAgentPasswordReset(
            user.nom,
            user.email,
            tempPassword
        ).catch(error => {
            console.error(`[AgentsAdminService] Erreur lors de l'envoi de l'email de réinitialisation à ${user.email}:`, error);
        });

        return this.mapToAgentResponseDto(user);
    }

    /**
     * Mappe un User vers AgentResponseDto
     * @param user Utilisateur à mapper
     * @returns AgentResponseDto
     * @private
     */
    private mapToAgentResponseDto(user: User): AgentResponseDto {
        return {
            id: user.id,
            nom: user.nom,
            email: user.email,
            telephone: user.telephone ?? undefined,
            type_utilisateur: user.type_utilisateur,
            statut: user.statut,
            premiere_connexion: user.premiere_connexion,
            date_creation: user.date_creation,
            date_modification: user.date_modification,
            derniere_connexion: user.derniere_connexion ?? undefined,
        };
    }
}

