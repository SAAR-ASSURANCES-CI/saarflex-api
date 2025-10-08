import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Profile } from '../entities/profile.entity';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ProfileDto } from '../dto/profile.dto';
import { DateUtilsService } from '../utils/date-utils.service';
import { UserManagementService } from './user-management.service';

/**
 * Service responsable de la gestion des profils utilisateur
 */
@Injectable()
export class ProfileService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Profile)
        private readonly profileRepository: Repository<Profile>,
        private readonly dateUtilsService: DateUtilsService,
        private readonly userManagementService: UserManagementService,
    ) {}

    /**
     * Retourne le profil complet de l'utilisateur
     * @param userId ID de l'utilisateur
     * @returns ProfileDto
     */
    async getProfile(userId: string): Promise<ProfileDto> {
        const user = await this.userManagementService.findById(userId);
        let profile = await this.profileRepository.findOne({ where: { user_id: user.id } });
        
        if (!profile) {
            profile = await this.ensureProfileExists(user.id);
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
            date_naissance: profile.date_naissance 
                ? this.dateUtilsService.formatDateDDMMYYYY(profile.date_naissance) 
                : undefined,
            numero_piece_identite: profile.numero_piece_identite ?? undefined,
            type_piece_identite: profile.type_piece_identite ?? undefined,
            date_expiration_piece_identite: profile.date_expiration_piece_identite 
                ? this.dateUtilsService.formatDateDDMMYYYY(profile.date_expiration_piece_identite) 
                : undefined,
            front_document_path: profile.chemin_recto_piece ?? undefined,
            back_document_path: profile.chemin_verso_piece ?? undefined,
        };
    }

    /**
     * Met à jour le profil utilisateur
     * @param userId ID de l'utilisateur
     * @param dto Données de mise à jour
     * @returns ProfileDto mis à jour
     */
    async updateProfile(userId: string, dto: UpdateProfileDto): Promise<ProfileDto> {
        const user = await this.userManagementService.findById(userId);

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

        // On récupère ou crée le profil
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

        // Gestion de la date de naissance
        if (typeof dto.date_naissance !== 'undefined') {
            if (dto.date_naissance) {
                profile.date_naissance = this.dateUtilsService.validateBirthDate(dto.date_naissance);
            } else {
                profile.date_naissance = null;
            }
        }

        // Gestion de la date d'expiration
        if (typeof dto.date_expiration_piece_identite !== 'undefined') {
            if (dto.date_expiration_piece_identite) {
                profile.date_expiration_piece_identite = this.dateUtilsService.validateExpirationDate(dto.date_expiration_piece_identite);
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
            date_naissance: savedProfile.date_naissance 
                ? this.dateUtilsService.formatDateDDMMYYYY(savedProfile.date_naissance) 
                : undefined,
            numero_piece_identite: savedProfile.numero_piece_identite ?? undefined,
            type_piece_identite: savedProfile.type_piece_identite ?? undefined,
            date_expiration_piece_identite: savedProfile.date_expiration_piece_identite 
                ? this.dateUtilsService.formatDateDDMMYYYY(savedProfile.date_expiration_piece_identite) 
                : undefined,
        };
    }

    /**
     * S'assure qu'un profil existe pour l'utilisateur
     * @param userId ID de l'utilisateur
     * @returns Profile créé
     * @private
     */
    private async ensureProfileExists(userId: string): Promise<Profile> {
        return await this.profileRepository.save(
            this.profileRepository.create({ user_id: userId })
        );
    }

    /**
     * Valide que le profil est complet pour un type de produit donné
     * @param userId ID de l'utilisateur
     * @param typeProduit Type de produit (VIE, IARD, etc.)
     * @throws BadRequestException si le profil est incomplet
     */
    async validateProfileCompleteness(userId: string, typeProduit: string): Promise<void> {
        const profile = await this.profileRepository.findOne({ where: { user_id: userId } });
        
        if (!profile) {
            throw new BadRequestException('Profil utilisateur non trouvé. Veuillez compléter votre profil.');
        }

        const champsRequis = [
            'numero_piece_identite',
            'type_piece_identite',
            'adresse'
        ];

        if (typeProduit === 'VIE') {
            if (!profile.date_naissance) {
                throw new BadRequestException('Date de naissance requise pour les produits Vie. Veuillez compléter votre profil.');
            }
        }

        for (const champ of champsRequis) {
            if (!profile[champ]) {
                throw new BadRequestException(`${champ} requis. Veuillez compléter votre profil.`);
            }
        }
    }
}

