import { Injectable } from '@nestjs/common';
import { RegisterDto, RegisterResponseDto } from './dto/register.dto';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileDto } from './dto/profile.dto';
import { User } from './entities/user.entity';
import { AuthService } from './services/auth.service';
import { PasswordResetService } from './services/password-reset.service';
import { ProfileService } from './services/profile.service';
import { UserManagementService } from './services/user-management.service';
import { SessionService } from './services/session.service';

/**
 * Service façade pour la gestion des utilisateurs
 * Délègue les opérations aux services spécialisés
 * 
 * Cette architecture permet :
 * - Séparation des responsabilités (SOLID)
 * - Meilleure testabilité
 * - Réutilisabilité des services
 * - Pas de breaking changes pour les contrôleurs
 */
@Injectable()
export class UsersService {
    constructor(
        private readonly authService: AuthService,
        private readonly passwordResetService: PasswordResetService,
        private readonly profileService: ProfileService,
        private readonly userManagementService: UserManagementService,
        private readonly sessionService: SessionService,
    ) {}

    // ==================== Authentification ====================

    /**
     * Inscrit un nouvel utilisateur
     * @param registerDto Données d'inscription
     * @param ipAddress Adresse IP optionnelle
     * @param userAgent User agent optionnel
     * @returns RegisterResponseDto
     */
    async register(
        registerDto: RegisterDto,
        ipAddress?: string,
        userAgent?: string
    ): Promise<RegisterResponseDto> {
        return this.authService.register(registerDto, ipAddress, userAgent);
    }

    /**
     * Connecte un utilisateur existant
     * @param loginDto Données de connexion
     * @param ipAddress Adresse IP optionnelle
     * @param userAgent User agent optionnel
     * @returns LoginResponseDto
     */
    async login(
        loginDto: LoginDto,
        ipAddress?: string,
        userAgent?: string
    ): Promise<LoginResponseDto> {
        return this.authService.login(loginDto, ipAddress, userAgent);
    }

    // ==================== Réinitialisation mot de passe ====================

    /**
     * Demande de réinitialisation du mot de passe
     * @param dto Données de la demande
     */
    async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
        return this.passwordResetService.forgotPassword(dto);
    }

    /**
     * Vérifie un code OTP
     * @param dto Données de vérification
     */
    async verifyOtp(dto: VerifyOtpDto): Promise<void> {
        return this.passwordResetService.verifyOtp(dto);
    }

    /**
     * Réinitialise le mot de passe
     * @param dto Données de réinitialisation
     */
    async resetPassword(dto: ResetPasswordDto): Promise<void> {
        return this.passwordResetService.resetPassword(dto);
    }

    // ==================== Gestion profil ====================

    /**
     * Retourne le profil de l'utilisateur courant
     * @param userId ID de l'utilisateur
     * @returns ProfileDto
     */
    async getProfile(userId: string): Promise<ProfileDto> {
        return this.profileService.getProfile(userId);
    }

    /**
     * Met à jour le profil de l'utilisateur
     * @param userId ID de l'utilisateur
     * @param dto Données de mise à jour
     * @returns ProfileDto
     */
    async updateProfile(userId: string, dto: UpdateProfileDto): Promise<ProfileDto> {
        return this.profileService.updateProfile(userId, dto);
    }

    // ==================== Gestion utilisateurs ====================

    /**
     * Recherche un utilisateur par son ID
     * @param id ID de l'utilisateur
     * @returns User
     */
    async findById(id: string): Promise<User> {
        return this.userManagementService.findById(id);
    }

    /**
     * Recherche un utilisateur par son email
     * @param email Email de l'utilisateur
     * @returns User | null
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.userManagementService.findByEmail(email);
    }

    /**
     * Vérifie si un email existe déjà
     * @param email Email à vérifier
     * @returns boolean
     */
    async emailExists(email: string): Promise<boolean> {
        return this.userManagementService.emailExists(email);
    }

    /**
     * Vérifie si un numéro de téléphone existe déjà
     * @param telephone Numéro de téléphone à vérifier
     * @returns boolean
     */
    async phoneExists(telephone: string): Promise<boolean> {
        return this.userManagementService.phoneExists(telephone);
    }

    /**
     * Met à jour la date de dernière connexion
     * @param userId ID de l'utilisateur
     */
    async updateLastLogin(userId: string): Promise<void> {
        return this.userManagementService.updateLastLogin(userId);
    }

    /**
     * Désactive un utilisateur et toutes ses sessions
     * @param userId ID de l'utilisateur
     */
    async deactivateUser(userId: string): Promise<void> {
        return this.userManagementService.deactivateUser(userId);
    }

    // ==================== Gestion sessions ====================

    /**
     * Invalide une session spécifique
     * @param sessionId ID de la session
     */
    async invalidateSession(sessionId: string): Promise<void> {
        return this.sessionService.invalidateSession(sessionId);
    }

    /**
     * Invalide toutes les sessions d'un utilisateur
     * @param userId ID de l'utilisateur
     */
    async invalidateAllUserSessions(userId: string): Promise<void> {
        return this.sessionService.invalidateAllUserSessions(userId);
    }
}
