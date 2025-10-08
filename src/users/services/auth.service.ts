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
import { RegisterDto, RegisterResponseDto } from '../dto/register.dto';
import { LoginDto, LoginResponseDto } from '../dto/login.dto';
import { JwtService } from '../jwt/jwt.service';
import { EmailService } from '../email/email.service';
import { SessionService } from './session.service';
import { NotificationService } from './notification.service';
import { UserManagementService } from './user-management.service';

/**
 * Service responsable de l'authentification (inscription et connexion)
 */
@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly emailService: EmailService,
        private readonly sessionService: SessionService,
        private readonly notificationService: NotificationService,
        private readonly userManagementService: UserManagementService,
    ) {}

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

        return {
            id: user.id,
            nom: user.nom,
            email: user.email,
            telephone: user.telephone,
            type_utilisateur: user.type_utilisateur,
            statut: user.statut,
            date_creation: user.date_creation,
            token,
            token_type: 'Bearer',
            expires_in: 86400, // 24 heures
        };
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

