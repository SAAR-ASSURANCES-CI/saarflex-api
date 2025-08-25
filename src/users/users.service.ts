import {
    Injectable,
    ConflictException,
    BadRequestException,
    NotFoundException,
    InternalServerErrorException,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserType } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import { Session } from './entities/session.entity';
import { Notification } from './entities/notification.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { RegisterDto, RegisterResponseDto } from './dto/register.dto';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { JwtService } from './jwt/jwt.service';
import { EmailService } from './email/email.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileDto } from './dto/profile.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Profile)
        private readonly profileRepository: Repository<Profile>,
        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
        @InjectRepository(PasswordReset)
        private readonly passwordResetRepository: Repository<PasswordReset>,
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
                telephone: savedUser.telephone ?? undefined,
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
     * Connecte un utilisateur existant.
     * - Vérifie l'existence de l'utilisateur
     * - Compare le mot de passe (bcrypt)
     * - Vérifie que l'utilisateur est actif
     * - Met à jour la dernière connexion
     * - Génère un JWT et crée une session
     */
    async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<LoginResponseDto> {
        const user = await this.findByEmail(loginDto.email);
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

        await this.updateLastLogin(user.id);

        const token = this.jwtService.generateToken(user);
        await this.createUserSession(user.id, token, ipAddress, userAgent);

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
            expires_in: 86400,
        };
    }

    /**
     * Demande de réinitialisation du mot de passe
     */
    async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
        const user = await this.findByEmail(dto.email);
        if (!user) {
            return;
        }

        await this.passwordResetRepository.update({ user_id: user.id, used: false }, { used: true, used_at: new Date() });

        const code = this.generateSixDigitCode();
        const codeHash = await bcrypt.hash(code, 12);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        const record = this.passwordResetRepository.create({
            user_id: user.id,
            code_hash: codeHash,
            expires_at: expiresAt,
            used: false,
            used_at: null,
        });
        await this.passwordResetRepository.save(record);

        await this.emailService.sendPasswordResetCode(user.email, code);
    }

    /**
     * Vérifie un code OTP sans changer le mot de passe
     */
    async verifyOtp(dto: VerifyOtpDto): Promise<void> {
        const user = await this.findByEmail(dto.email);
        if (!user) {
            throw new BadRequestException('Code invalide');
        }
        const latest = await this.passwordResetRepository.findOne({
            where: { user_id: user.id, used: false },
            order: { created_at: 'DESC' },
        });
        if (!latest) throw new BadRequestException('Code invalide');
        if (latest.expires_at.getTime() < Date.now()) throw new BadRequestException('Code expiré');
        const match = await bcrypt.compare(dto.code, latest.code_hash);
        if (!match) throw new BadRequestException('Code invalide');
    }

    /**
     * Réinitialise le mot de passe après vérification du code OTP
     */
    async resetPassword(dto: ResetPasswordDto): Promise<void> {
        const user = await this.findByEmail(dto.email);
        if (!user) {
            throw new BadRequestException('Opération invalide');
        }
        const latest = await this.passwordResetRepository.findOne({
            where: { user_id: user.id, used: false },
            order: { created_at: 'DESC' },
        });
        if (!latest) throw new BadRequestException('Code invalide');
        if (latest.expires_at.getTime() < Date.now()) throw new BadRequestException('Code expiré');
        const match = await bcrypt.compare(dto.code, latest.code_hash);
        if (!match) throw new BadRequestException('Code invalide');

        const newHash = await bcrypt.hash(dto.nouveau_mot_de_passe, 12);
        await this.userRepository.update(user.id, { mot_de_passe: newHash });

        await this.passwordResetRepository.update(latest.id, { used: true, used_at: new Date() });
        await this.invalidateAllUserSessions(user.id);
    }

    /**
     * Retourne le profil de l'utilisateur courant (sans mot de passe)
     */
    async getProfile(userId: string): Promise<ProfileDto> {
        const user = await this.findById(userId);
        let profile = await this.profileRepository.findOne({ where: { user_id: user.id } });
        if (!profile) {
            profile = await this.profileRepository.save(
                this.profileRepository.create({ user_id: user.id })
            );
        }
        return {
            id: user.id,
            nom: user.nom,
            email: user.email,
            telephone: user.telephone,
            type_utilisateur: user.type_utilisateur,
            statut: user.statut,
            date_creation: user.date_creation,
            date_modification: user.date_modification,
            lieu_naissance: profile.lieu_naissance ?? undefined,
            sexe: profile.sexe ?? undefined,
            nationalite: profile.nationalite ?? undefined,
            profession: profile.profession ?? undefined,
            adresse: profile.adresse ?? undefined,
            date_naissance: profile.date_naissance ? this.formatDateDDMMYYYY(profile.date_naissance) : undefined,
            numero_piece_identite: profile.numero_piece_identite ?? undefined,
            type_piece_identite: profile.type_piece_identite ?? undefined,
            date_expiration_piece_identite: profile.date_expiration_piece_identite ? this.formatDateDDMMYYYY(profile.date_expiration_piece_identite) : undefined,
        };
    }

    /**
     * Met à jour le profil: nom et téléphone
     */
    async updateProfile(userId: string, dto: UpdateProfileDto): Promise<ProfileDto> {
        const user = await this.findById(userId);

        if (typeof dto.nom !== 'undefined') {
            user.nom = dto.nom.trim();
        }
        if (typeof dto.telephone !== 'undefined') {
            const newPhone = dto.telephone?.trim() ?? null;
            if (newPhone) {
                const exists = await this.userRepository.findOne({ where: { telephone: newPhone } });
                if (exists && exists.id !== user.id) {
                    throw new ConflictException('Ce numéro de téléphone est déjà utilisé');
                }
            }
            user.telephone = newPhone;
        }
        if (typeof dto.email !== 'undefined') {
            const newEmail = dto.email?.toLowerCase().trim() ?? null;
            if (newEmail) {
                const existsEmail = await this.userRepository.findOne({ where: { email: newEmail } });
                if (existsEmail && existsEmail.id !== user.id) {
                    throw new ConflictException('Cet email est déjà utilisé');
                }
                user.email = newEmail;
            }
        }

        let profile = await this.profileRepository.findOne({ where: { user_id: user.id } });
        if (!profile) {
            profile = this.profileRepository.create({ user_id: user.id });
        }

        if (typeof dto.lieu_naissance !== 'undefined') profile.lieu_naissance = dto.lieu_naissance?.trim() ?? null;
        if (typeof dto.sexe !== 'undefined') profile.sexe = dto.sexe?.trim() ?? null;
        if (typeof dto.nationalite !== 'undefined') profile.nationalite = dto.nationalite?.trim() ?? null;
        if (typeof dto.profession !== 'undefined') profile.profession = dto.profession?.trim() ?? null;
        if (typeof dto.adresse !== 'undefined') profile.adresse = dto.adresse?.trim() ?? null;
        if (typeof dto.numero_piece_identite !== 'undefined') profile.numero_piece_identite = dto.numero_piece_identite?.trim() ?? null;
        if (typeof dto.type_piece_identite !== 'undefined') profile.type_piece_identite = dto.type_piece_identite?.trim() ?? null;
        if (typeof dto.date_naissance !== 'undefined') {
            if (dto.date_naissance) {
                const parsedDate = this.parseDDMMYYYY(dto.date_naissance);
                if (!parsedDate) {
                    throw new BadRequestException('Format de date de naissance invalide. Utilisez le format DD-MM-YYYY');
                }
                if (parsedDate >= new Date()) {
                    throw new BadRequestException('La date de naissance doit être dans le passé');
                }
                profile.date_naissance = parsedDate;
            } else {
                profile.date_naissance = null;
            }
        }
        if (typeof dto.date_expiration_piece_identite !== 'undefined') {
            if (dto.date_expiration_piece_identite) {
                const parsedDate = this.parseDDMMYYYY(dto.date_expiration_piece_identite);
                if (!parsedDate) {
                    throw new BadRequestException('Format de date d\'expiration invalide. Utilisez le format DD-MM-YYYY');
                }
                if (parsedDate <= new Date()) {
                    throw new BadRequestException('La date d\'expiration de la pièce d\'identité doit être dans le futur');
                }
                profile.date_expiration_piece_identite = parsedDate;
            } else {
                profile.date_expiration_piece_identite = null;
            }
        }

        const [savedUser, savedProfile] = await Promise.all([
            this.userRepository.save(user),
            this.profileRepository.save(profile),
        ]);

        return {
            id: savedUser.id,
            nom: savedUser.nom,
            email: savedUser.email,
            telephone: savedUser.telephone ?? undefined,
            type_utilisateur: savedUser.type_utilisateur,
            statut: savedUser.statut,
            date_creation: savedUser.date_creation,
            date_modification: savedUser.date_modification,
            lieu_naissance: savedProfile.lieu_naissance ?? undefined,
            sexe: savedProfile.sexe ?? undefined,
            nationalite: savedProfile.nationalite ?? undefined,
            profession: savedProfile.profession ?? undefined,
            adresse: savedProfile.adresse ?? undefined,
            date_naissance: savedProfile.date_naissance ? this.formatDateDDMMYYYY(savedProfile.date_naissance) : undefined,
            numero_piece_identite: savedProfile.numero_piece_identite ?? undefined,
            type_piece_identite: savedProfile.type_piece_identite ?? undefined,
            date_expiration_piece_identite: savedProfile.date_expiration_piece_identite ? this.formatDateDDMMYYYY(savedProfile.date_expiration_piece_identite) : undefined,
        };
    }

    private parseDDMMYYYY(input: string): Date | null {
        if (!input || typeof input !== 'string') return null;

        const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(input);
        if (!match) return null;

        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);


        if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
            return null;
        }

        const date = new Date(Date.UTC(year, month - 1, day));

        if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
            return null;
        }

        return date;
    }

    private formatDateDDMMYYYY(date: Date): string {
        const d = new Date(date);
        const day = String(d.getUTCDate()).padStart(2, '0');
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const year = d.getUTCFullYear();
        return `${day}-${month}-${year}`;
    }

    private generateSixDigitCode(): string {
        const n = Math.floor(Math.random() * 1000000);
        return n.toString().padStart(6, '0');
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