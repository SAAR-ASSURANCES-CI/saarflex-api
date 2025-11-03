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
     * Crée un nouvel agent avec mot de passe généré
     * @param createAgentDto Données de création
     * @returns AgentResponseDto
     */
    async createAgent(createAgentDto: CreateAgentDto): Promise<AgentResponseDto> {
        try {
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

            const newAgent = this.userRepository.create({
                nom: createAgentDto.nom.trim(),
                email: createAgentDto.email.toLowerCase().trim(),
                telephone: createAgentDto.telephone?.trim() || null,
                mot_de_passe: hashedPassword,
                type_utilisateur: UserType.AGENT,
                statut: true,
                premiere_connexion: true,
                mot_de_passe_temporaire: true,
            });

            const savedAgent = await this.userRepository.save(newAgent);

            this.emailService.sendAgentCredentials(
                savedAgent.nom,
                savedAgent.email,
                tempPassword
            ).catch(error => {
                console.error(`[AgentsAdminService] Erreur lors de l'envoi de l'email à ${savedAgent.email}:`, error);
            });

            return this.mapToAgentResponseDto(savedAgent);
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            console.error('[AgentsAdminService] Erreur lors de la création de l\'agent:', error);
            throw new InternalServerErrorException('Erreur lors de la création de l\'agent');
        }
    }

    /**
     * Récupère tous les agents avec pagination
     * @param page Numéro de page
     * @param limit Nombre d'éléments par page
     * @returns AgentsResponseDto
     */
    async getAllAgents(page: number = 1, limit: number = 10): Promise<AgentsResponseDto> {
        const skip = (page - 1) * limit;

        const [agents, total] = await this.userRepository.findAndCount({
            where: { type_utilisateur: UserType.AGENT },
            select: ['id', 'nom', 'email', 'telephone', 'statut', 'premiere_connexion', 'date_creation', 'date_modification', 'derniere_connexion'],
            order: { date_creation: 'DESC' },
            skip,
            take: limit,
        });

        return {
            agents: agents.map(agent => this.mapToAgentResponseDto(agent)),
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit),
        };
    }

    /**
     * Récupère un agent par son ID
     * @param id ID de l'agent
     * @returns AgentResponseDto
     * @throws NotFoundException si l'agent n'existe pas
     */
    async getAgentById(id: string): Promise<AgentResponseDto> {
        const agent = await this.userRepository.findOne({
            where: { id, type_utilisateur: UserType.AGENT },
            select: ['id', 'nom', 'email', 'telephone', 'statut', 'premiere_connexion', 'date_creation', 'date_modification', 'derniere_connexion'],
        });

        if (!agent) {
            throw new NotFoundException('Agent non trouvé');
        }

        return this.mapToAgentResponseDto(agent);
    }

    /**
     * Met à jour un agent
     * @param id ID de l'agent
     * @param updateAgentDto Données de mise à jour
     * @returns AgentResponseDto
     */
    async updateAgent(id: string, updateAgentDto: UpdateAgentDto): Promise<AgentResponseDto> {
        const agent = await this.userRepository.findOne({
            where: { id, type_utilisateur: UserType.AGENT },
        });

        if (!agent) {
            throw new NotFoundException('Agent non trouvé');
        }

        if (updateAgentDto.email && updateAgentDto.email !== agent.email) {
            const existingUser = await this.userManagementService.findByEmail(updateAgentDto.email);
            if (existingUser && existingUser.id !== id) {
                throw new ConflictException('Un utilisateur avec cet email existe déjà');
            }
        }

        if (updateAgentDto.telephone && updateAgentDto.telephone !== agent.telephone) {
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
            agent.nom = updateAgentDto.nom.trim();
        }
        if (updateAgentDto.email) {
            agent.email = updateAgentDto.email.toLowerCase().trim();
        }
        if (updateAgentDto.telephone !== undefined) {
            agent.telephone = updateAgentDto.telephone?.trim() || null;
        }

        const updatedAgent = await this.userRepository.save(agent);
        return this.mapToAgentResponseDto(updatedAgent);
    }

    /**
     * Suspend un agent (désactive son compte et invalide ses sessions)
     * @param id ID de l'agent
     * @returns AgentResponseDto
     */
    async suspendAgent(id: string): Promise<AgentResponseDto> {
        const agent = await this.userRepository.findOne({
            where: { id, type_utilisateur: UserType.AGENT },
        });

        if (!agent) {
            throw new NotFoundException('Agent non trouvé');
        }

        if (!agent.statut) {
            throw new BadRequestException('L\'agent est déjà suspendu');
        }

        await this.userManagementService.deactivateUser(id);
        await this.sessionService.invalidateAllUserSessions(id);

        const suspendedAgent = await this.userRepository.findOne({
            where: { id },
            select: ['id', 'nom', 'email', 'telephone', 'statut', 'premiere_connexion', 'date_creation', 'date_modification', 'derniere_connexion'],
        });

        return this.mapToAgentResponseDto(suspendedAgent!);
    }

    /**
     * Réactive un agent
     * @param id ID de l'agent
     * @returns AgentResponseDto
     */
    async activateAgent(id: string): Promise<AgentResponseDto> {
        const agent = await this.userRepository.findOne({
            where: { id, type_utilisateur: UserType.AGENT },
        });

        if (!agent) {
            throw new NotFoundException('Agent non trouvé');
        }

        if (agent.statut) {
            throw new BadRequestException('L\'agent est déjà actif');
        }

        await this.userManagementService.activateUser(id);

        const activatedAgent = await this.userRepository.findOne({
            where: { id },
            select: ['id', 'nom', 'email', 'telephone', 'statut', 'premiere_connexion', 'date_creation', 'date_modification', 'derniere_connexion'],
        });

        return this.mapToAgentResponseDto(activatedAgent!);
    }

    /**
     * Réinitialise le mot de passe d'un agent (admin-initiated)
     * @param id ID de l'agent
     * @returns AgentResponseDto
     */
    async resetAgentPassword(id: string): Promise<AgentResponseDto> {
        const agent = await this.userRepository.findOne({
            where: { id, type_utilisateur: UserType.AGENT },
        });

        if (!agent) {
            throw new NotFoundException('Agent non trouvé');
        }

        const tempPassword = this.generateSecurePassword();
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

        agent.mot_de_passe = hashedPassword;
        agent.premiere_connexion = true;
        agent.mot_de_passe_temporaire = true;

        await this.userRepository.save(agent);

        await this.sessionService.invalidateAllUserSessions(id);

        this.emailService.sendAgentPasswordReset(
            agent.nom,
            agent.email,
            tempPassword
        ).catch(error => {
            console.error(`[AgentsAdminService] Erreur lors de l'envoi de l'email de réinitialisation à ${agent.email}:`, error);
        });

        return this.mapToAgentResponseDto(agent);
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
            statut: user.statut,
            premiere_connexion: user.premiere_connexion,
            date_creation: user.date_creation,
            date_modification: user.date_modification,
            derniere_connexion: user.derniere_connexion ?? undefined,
        };
    }
}

