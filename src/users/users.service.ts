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

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
    ) { }


    async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
        try {
            // Vérifier si l'email existe déjà
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
            });

            const savedUser = await this.userRepository.save(newUser);

            await this.createWelcomeNotification(savedUser.id);

            return {
                id: savedUser.id,
                nom: savedUser.nom,
                email: savedUser.email,
                telephone: savedUser.telephone,
                type_utilisateur: savedUser.type_utilisateur,
                statut: savedUser.statut,
                date_creation: savedUser.date_creation,
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
     * Trouver un utilisateur par ID
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
     * Trouver un utilisateur par email
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { email: email.toLowerCase().trim() },
        });
    }

    /**
     * Vérifier si un email existe
     */
    async emailExists(email: string): Promise<boolean> {
        const count = await this.userRepository.count({
            where: { email: email.toLowerCase().trim() },
        });
        return count > 0;
    }

    /**
     * Vérifier si un téléphone existe
     */
    async phoneExists(telephone: string): Promise<boolean> {
        const count = await this.userRepository.count({
            where: { telephone: telephone.trim() },
        });
        return count > 0;
    }

    /**
     * Mettre à jour la dernière connexion
     */
    async updateLastLogin(userId: string): Promise<void> {
        await this.userRepository.update(userId, {
            derniere_connexion: new Date(),
        });
    }

    /**
     * Désactiver un utilisateur
     */
    async deactivateUser(userId: string): Promise<void> {
        await this.userRepository.update(userId, { statut: false });

        // Invalider toutes les sessions actives
        await this.sessionRepository.update(
            { user_id: userId },
            { is_active: false }
        );
    }

    /**
     * Créer une notification de bienvenue
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

    /**
     * Obtenir les statistiques utilisateurs (pour les admins)
     */
    async getUserStats(): Promise<{
        total: number;
        actifs: number;
        inactifs: number;
        parType: Record<UserType, number>;
    }> {
        const total = await this.userRepository.count();
        const actifs = await this.userRepository.count({ where: { statut: true } });
        const inactifs = total - actifs;

        const parType = {
            [UserType.CLIENT]: await this.userRepository.count({
                where: { type_utilisateur: UserType.CLIENT },
            }),
            [UserType.AGENT]: await this.userRepository.count({
                where: { type_utilisateur: UserType.AGENT },
            }),
            [UserType.DRH]: await this.userRepository.count({
                where: { type_utilisateur: UserType.DRH },
            }),
            [UserType.ADMIN]: await this.userRepository.count({
                where: { type_utilisateur: UserType.ADMIN },
            }),
        };

        return { total, actifs, inactifs, parType };
    }
}