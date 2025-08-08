import {
    Injectable,
    ConflictException,
    BadRequestException,
    NotFoundException,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserType } from './entities/user.entity';
import { Session } from './entities/session.entity';
import { Notification } from './entities/notification.entity';
import { RegisterDto, RegisterResponseDto } from './dto/register.dto';
import { JwtService } from './jwt/jwt.service';
import { EmailService } from './email/email.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
        private readonly jwtService: JwtService,
        private readonly emailService: EmailService,
    ) { }

    /**
     * Inscrit un nouvel utilisateur.
     * @param registerDto Données d'inscription
     * @param ipAddress Adresse IP optionnelle
     * @param userAgent User agent optionnel
     * @returns RegisterResponseDto (objet contenant les infos de l'utilisateur et le token)
     * @throws ConflictException, BadRequestException, InternalServerErrorException
     */
    async register(registerDto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<RegisterResponseDto> {
        try {

            const existingUser = await this.userRepository.findOne({
                where: { email: registerDto.email },
            });

            if (existingUser) {
                throw new ConflictException(
                    'Un utilisateur avec cet email existe déjà'
                );
            }

            if (registerDto.telephone) {
                const existingPhone = await this.userRepository.findOne({
                    where: { telephone: registerDto.telephone },
                });

                if (existingPhone) {
                    throw new ConflictException(
                        'Un utilisateur avec ce numéro de téléphone existe déjà'
                    );
                }
            }

            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(
                registerDto.mot_de_passe,
                saltRounds
            );

            const newUser = this.userRepository.create({
                nom: registerDto.nom.trim(),
                email: registerDto.email.toLowerCase().trim(),
                telephone: registerDto.telephone?.trim(),
                mot_de_passe: hashedPassword,
                type_utilisateur: registerDto.type_utilisateur || UserType.CLIENT,
                statut: true,
                derniere_connexion: new Date(),
            });

            const savedUser = await this.userRepository.save(newUser);

            const token = this.jwtService.generateToken(savedUser);

            await this.createUserSession(savedUser.id, token, ipAddress, userAgent);

            await this.createWelcomeNotification(savedUser.id);

            this.sendWelcomeEmailAsync(savedUser);

            return {
                id: savedUser.id,
                nom: savedUser.nom,
                email: savedUser.email,
                telephone: savedUser.telephone,
                type_utilisateur: savedUser.type_utilisateur,
                statut: savedUser.statut,
                date_creation: savedUser.date_creation,
                token: token,
                token_type: 'Bearer',
                expires_in: 86400,
            };
        } catch (error) {
            if (
                error instanceof ConflictException ||
                error instanceof BadRequestException
            ) {
                throw error;
            }

            throw new InternalServerErrorException(
                'Erreur lors de la création du compte utilisateur'
            );
        }
    }

    /**
     * Envoie l'email de bienvenue de manière asynchrone
     * @param user Utilisateur nouvellement inscrit
     */
    private async sendWelcomeEmailAsync(user: User): Promise<void> {
        try {
            await this.emailService.sendWelcomeEmail(user);
        } catch (error) {
            console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', error);
        }
    }

    /**
     * Crée une session utilisateur.
     * @param userId ID de l'utilisateur
     * @param token Token JWT
     * @param ipAddress Adresse IP optionnelle
     * @returns Session (objet session créée)
     */
    private async createUserSession(
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
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            is_active: true,
        });

        return await this.sessionRepository.save(session);
    }

    /**
     * Recherche un utilisateur par son ID.
     * @param id ID de l'utilisateur
     * @returns User (l'utilisateur trouvé)
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
     * Recherche un utilisateur par son email.
     * @param email Email de l'utilisateur
     * @returns User | null (l'utilisateur trouvé ou null)
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { email: email.toLowerCase().trim() },
        });
    }

    /**
     * Vérifie si un email existe déjà.
     * @param email Email à vérifier
     * @returns boolean (true si l'email existe, sinon false)
     */
    async emailExists(email: string): Promise<boolean> {
        const count = await this.userRepository.count({
            where: { email: email.toLowerCase().trim() },
        });
        return count > 0;
    }

    /**
     * Vérifie si un numéro de téléphone existe déjà.
     * @param telephone Numéro de téléphone à vérifier
     * @returns boolean (true si le téléphone existe, sinon false)
     */
    async phoneExists(telephone: string): Promise<boolean> {
        const count = await this.userRepository.count({
            where: { telephone: telephone.trim() },
        });
        return count > 0;
    }

    /**
     * Met à jour la date de dernière connexion de l'utilisateur.
     * @param userId ID de l'utilisateur
     * @returns void
     */
    async updateLastLogin(userId: string): Promise<void> {
        await this.userRepository.update(userId, {
            derniere_connexion: new Date(),
        });
    }

    /**
     * Désactive un utilisateur et toutes ses sessions.
     * @param userId ID de l'utilisateur
     * @returns void
     */
    async deactivateUser(userId: string): Promise<void> {
        await this.userRepository.update(userId, { statut: false });

        await this.sessionRepository.update(
            { user_id: userId },
            { is_active: false }
        );
    }

    /**
     * Invalide toutes les sessions d'un utilisateur.
     * @param userId ID de l'utilisateur
     * @returns void
     */
    async invalidateAllUserSessions(userId: string): Promise<void> {
        await this.sessionRepository.update(
            { user_id: userId },
            { is_active: false }
        );
    }

    /**
     * Invalide une session spécifique.
     * @param sessionId ID de la session
     * @returns void
     */
    async invalidateSession(sessionId: string): Promise<void> {
        await this.sessionRepository.update(sessionId, { is_active: false });
    }

    /**
     * Crée une notification de bienvenue pour l'utilisateur.
     * @param userId ID de l'utilisateur
     * @returns void
     */
    private async createWelcomeNotification(userId: string): Promise<void> {
        const notification = this.notificationRepository.create({
            user_id: userId,
            titre: 'Bienvenue !',
            message: 'Votre compte a été créé avec succès. Bienvenue sur notre plateforme d\'assurance.',
            type: 'welcome',
            lu: false,
        });

        await this.notificationRepository.save(notification);
    }
}