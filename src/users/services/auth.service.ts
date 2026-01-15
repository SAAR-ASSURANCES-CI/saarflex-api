import {
    Injectable,
    ConflictException,
    BadRequestException,
    InternalServerErrorException,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserType } from '../entities/user.entity';
import { Profile } from '../entities/profile.entity';
import { RegisterDto, RegisterResponseDto } from '../dto/register.dto';
import { LoginDto, LoginResponseDto } from '../dto/login.dto';
import { JwtService } from '../jwt/jwt.service';
import { EmailService } from '../email/email.service';
import { SessionService } from './session.service';
import { NotificationService } from './notification.service';
import { UserManagementService } from './user-management.service';
import { ProfileService } from './profile.service';

/**
 * Service responsable de l'authentification (inscription et connexion)
 */
@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Profile)
        private readonly profileRepository: Repository<Profile>,
        private readonly jwtService: JwtService,
        private readonly emailService: EmailService,
        private readonly sessionService: SessionService,
        private readonly notificationService: NotificationService,
        private readonly userManagementService: UserManagementService,
        private readonly profileService: ProfileService,
    ) { }

    /**
     * Inscrit un nouvel utilisateur
     * @param registerDto Données d'inscription
     * @param ipAddress Adresse IP optionnelle
     * @param userAgent User agent optionnel
     * @returns RegisterResponseDto
     * @throws ConflictException, BadRequestException, InternalServerErrorException
     */
    async register(
        registerDto: RegisterDto,
        ipAddress?: string,
        userAgent?: string
    ): Promise<RegisterResponseDto> {
        try {

            const existingUser = await this.userManagementService.findByEmail(registerDto.email);
            if (existingUser) {
                throw new ConflictException('Un utilisateur avec cet email existe déjà');
            }

            if (registerDto.telephone) {
                const existingPhone = await this.userRepository.findOne({
                    where: { telephone: registerDto.telephone },
                });

                if (existingPhone) {
                    throw new ConflictException('Un utilisateur avec ce numéro de téléphone existe déjà');
                }
            }

            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(registerDto.mot_de_passe, saltRounds);

            const newUser = this.userRepository.create({
                nom: registerDto.nom.trim(),
                email: registerDto.email.toLowerCase().trim(),
                telephone: registerDto.telephone?.trim(),
                mot_de_passe: hashedPassword,
                type_utilisateur: registerDto.type_utilisateur || UserType.CLIENT,
                statut: true,
                premiere_connexion: false, // Les utilisateurs normaux n'ont pas besoin de changer leur mot de passe
                mot_de_passe_temporaire: false,
                derniere_connexion: new Date(),
            });

            const savedUser = await this.userRepository.save(newUser);


            const token = this.jwtService.generateToken(savedUser);


            await this.sessionService.createSession(savedUser.id, token, ipAddress, userAgent);

            await this.notificationService.createWelcomeNotification(savedUser.id);

            this.sendWelcomeEmailAsync(savedUser);

            return {
                id: savedUser.id,
                nom: savedUser.nom,
                email: savedUser.email,
                telephone: savedUser.telephone ?? undefined,
                type_utilisateur: savedUser.type_utilisateur,
                statut: savedUser.statut,
                date_creation: savedUser.date_creation,
                avatar_url: null, // New users don't have an avatar yet
                token: token,
                token_type: 'Bearer',
                expires_in: 86400, // 24 heures
            };
        } catch (error) {
            if (error instanceof ConflictException || error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException('Erreur lors de la création du compte utilisateur');
        }
    }

    /**
     * Connecte un utilisateur existant
     * @param loginDto Données de connexion
     * @param ipAddress Adresse IP optionnelle
     * @param userAgent User agent optionnel
     * @returns LoginResponseDto
     * @throws UnauthorizedException, ForbiddenException
     */
    async login(
        loginDto: LoginDto,
        ipAddress?: string,
        userAgent?: string
    ): Promise<LoginResponseDto> {

        const user = await this.userManagementService.findByEmail(loginDto.email);
        if (!user) {
            throw new UnauthorizedException('Adresse email incorrecte');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.mot_de_passe, user.mot_de_passe);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Mot de passe incorrect');
        }

        if (!user.statut) {
            throw new ForbiddenException('Compte bloqué. Veuillez contacter le support.');
        }

        await this.userManagementService.updateLastLogin(user.id);

        const token = this.jwtService.generateToken(user);

        await this.sessionService.createSession(user.id, token, ipAddress, userAgent);

        const profile = await this.profileRepository.findOne({ where: { user_id: user.id } });
        const avatarUrl = profile?.avatar_path ? this.profileService.getFileUrl(profile.avatar_path) : null;

        return {
            id: user.id,
            nom: user.nom,
            email: user.email,
            telephone: user.telephone,
            type_utilisateur: user.type_utilisateur,
            statut: user.statut,
            date_creation: user.date_creation,
            avatar_url: avatarUrl,
            token,
            token_type: 'Bearer',
            expires_in: 22400, // 6 heures
            premiere_connexion: user.premiere_connexion || false,
            must_change_password: user.premiere_connexion || false,
        };
    }

    /**
     * Change le mot de passe lors de la première connexion
     * @param userId ID de l'utilisateur
     * @param motDePasseActuel Mot de passe temporaire actuel
     * @param nouveauMotDePasse Nouveau mot de passe
     * @throws UnauthorizedException si le mot de passe actuel est incorrect
     * @throws BadRequestException si l'utilisateur n'a pas besoin de changer son mot de passe
     */
    async changePasswordOnFirstLogin(
        userId: string,
        motDePasseActuel: string,
        nouveauMotDePasse: string
    ): Promise<void> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new UnauthorizedException('Utilisateur non trouvé');
        }

        if (!user.premiere_connexion) {
            throw new BadRequestException('Vous n\'êtes pas tenu de changer votre mot de passe');
        }

        const isPasswordValid = await bcrypt.compare(motDePasseActuel, user.mot_de_passe);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Mot de passe actuel incorrect');
        }

        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(nouveauMotDePasse, saltRounds);

        user.mot_de_passe = hashedPassword;
        user.premiere_connexion = false;
        user.mot_de_passe_temporaire = false;

        await this.userRepository.save(user);
    }

    /**
     * Envoie l'email de bienvenue de manière asynchrone
     * @param user Utilisateur nouvellement inscrit
     * @private
     */
    private async sendWelcomeEmailAsync(user: User): Promise<void> {
        try {
            await this.emailService.sendWelcomeEmail(user);
        } catch (error) {
            console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', error);
        }
    }
}

