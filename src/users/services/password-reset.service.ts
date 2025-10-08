import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { PasswordReset } from '../entities/password-reset.entity';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { EmailService } from '../email/email.service';
import { SessionService } from './session.service';
import { UserManagementService } from './user-management.service';

/**
 * Service responsable de la réinitialisation de mot de passe
 */
@Injectable()
export class PasswordResetService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(PasswordReset)
        private readonly passwordResetRepository: Repository<PasswordReset>,
        private readonly emailService: EmailService,
        private readonly sessionService: SessionService,
        private readonly userManagementService: UserManagementService,
    ) {}

    /**
     * Demande de réinitialisation du mot de passe
     * Génère un code OTP et l'envoie par email
     * @param dto Données de la demande (email)
     */
    async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
        const user = await this.userManagementService.findByEmail(dto.email);
        if (!user) {
            // Ne pas révéler si l'email existe ou non
            return;
        }

        // Invalide tous les codes précédents
        await this.passwordResetRepository.update(
            { user_id: user.id, used: false },
            { used: true, used_at: new Date() }
        );

        const code = this.generateSixDigitCode();
        const codeHash = await bcrypt.hash(code, 12);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

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
     * @param dto Données de vérification (email, code)
     * @throws BadRequestException si le code est invalide ou expiré
     */
    async verifyOtp(dto: VerifyOtpDto): Promise<void> {
        const user = await this.userManagementService.findByEmail(dto.email);
        if (!user) {
            throw new BadRequestException('Code invalide');
        }

        const latest = await this.passwordResetRepository.findOne({
            where: { user_id: user.id, used: false },
            order: { created_at: 'DESC' },
        });

        if (!latest) {
            throw new BadRequestException('Code invalide');
        }

        if (latest.expires_at.getTime() < Date.now()) {
            throw new BadRequestException('Code expiré');
        }

        const match = await bcrypt.compare(dto.code, latest.code_hash);
        if (!match) {
            throw new BadRequestException('Code invalide');
        }
    }

    /**
     * Réinitialise le mot de passe après vérification du code OTP
     * @param dto Données de réinitialisation (email, code, nouveau mot de passe)
     * @throws BadRequestException si le code est invalide ou expiré
     */
    async resetPassword(dto: ResetPasswordDto): Promise<void> {
        const user = await this.userManagementService.findByEmail(dto.email);
        if (!user) {
            throw new BadRequestException('Opération invalide');
        }

        const latest = await this.passwordResetRepository.findOne({
            where: { user_id: user.id, used: false },
            order: { created_at: 'DESC' },
        });

        if (!latest) {
            throw new BadRequestException('Code invalide');
        }

        if (latest.expires_at.getTime() < Date.now()) {
            throw new BadRequestException('Code expiré');
        }

        const match = await bcrypt.compare(dto.code, latest.code_hash);
        if (!match) {
            throw new BadRequestException('Code invalide');
        }

        const newHash = await bcrypt.hash(dto.nouveau_mot_de_passe, 12);
        await this.userRepository.update(user.id, { mot_de_passe: newHash });

        await this.passwordResetRepository.update(latest.id, { 
            used: true, 
            used_at: new Date() 
        });

        
        await this.sessionService.invalidateAllUserSessions(user.id);
    }

    /**
     * Génère un code OTP à 6 chiffres
     * @returns Code OTP
     * @private
     */
    private generateSixDigitCode(): string {
        const n = Math.floor(Math.random() * 1000000);
        return n.toString().padStart(6, '0');
    }
}

