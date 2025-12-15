import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategorieProduit } from '../entities/categorie-produit.entity';

/**
 * Service de mapping entre les critères utilisateur et les catégories de produits
 * Utilisé pour déterminer automatiquement la catégorie d'un devis selon les critères
 */
@Injectable()
export class CategorieMappingService {
    constructor(
        @InjectRepository(CategorieProduit)
        private readonly categorieRepository: Repository<CategorieProduit>,
    ) { }

    /**
     * Mapping des types de véhicules vers les codes de catégories
     * Ce mapping peut être configuré en base de données à l'avenir
     */
    private readonly TYPE_VEHICULE_TO_CATEGORIE_CODE: Record<string, string> = {
        'Promenade et affaires': '1R',
        'TPV (0-5 places)': '120',
        'Transport public de marchandises': '130',
        'Tous risques': '140',
    };

    /**
     * Détermine la catégorie d'un produit selon les critères utilisateur
     * @param criteres_utilisateur Critères saisis par l'utilisateur
     * @param branche_id ID de la branche du produit
     * @returns ID de la catégorie déterminée ou null si non trouvée
     */
    async determinerCategorie(
        criteres_utilisateur: Record<string, any>,
        branche_id: string
    ): Promise<string | null> {
        // 1. Extraire le type de véhicule des critères
        const typeVehicule = this.extraireTypeVehicule(criteres_utilisateur);

        if (!typeVehicule) {
            // Pas de type de véhicule trouvé, on ne peut pas déterminer la catégorie
            return null;
        }

        // 2. Récupérer le code de catégorie correspondant
        const codeCategorie = this.TYPE_VEHICULE_TO_CATEGORIE_CODE[typeVehicule];

        if (!codeCategorie) {
            throw new BadRequestException(
                `Type de véhicule "${typeVehicule}" non reconnu. ` +
                `Types valides : ${Object.keys(this.TYPE_VEHICULE_TO_CATEGORIE_CODE).join(', ')}`
            );
        }

        // 3. Rechercher la catégorie en base de données
        const categorie = await this.categorieRepository.findOne({
            where: {
                code: codeCategorie,
                branche: {
                    id: branche_id,
                },
            },
        });

        if (!categorie) {
            throw new BadRequestException(
                `Catégorie avec le code "${codeCategorie}" non trouvée pour cette branche. ` +
                `Veuillez créer la catégorie correspondante.`
            );
        }

        return categorie.id;
    }

    /**
     * Extrait le type de véhicule des critères utilisateur
     * Cherche dans différentes clés possibles
     */
    private extraireTypeVehicule(criteres: Record<string, any>): string | null {
        // Clés possibles pour le type de véhicule
        const clesPossibles = [
            'Type de véhicule',
            'Type véhicule',
            'type_vehicule',
            'typeVehicule',
            'Catégorie véhicule',
            'categorie_vehicule',
        ];

        for (const cle of clesPossibles) {
            if (criteres[cle]) {
                return criteres[cle];
            }
        }

        return null;
    }

    /**
     * Vérifie si un type de véhicule est valide
     */
    isTypeVehiculeValide(typeVehicule: string): boolean {
        return typeVehicule in this.TYPE_VEHICULE_TO_CATEGORIE_CODE;
    }

    /**
     * Retourne la liste des types de véhicules supportés
     */
    getTypesVehiculesSupport(): string[] {
        return Object.keys(this.TYPE_VEHICULE_TO_CATEGORIE_CODE);
    }

    /**
     * Retourne le code de catégorie pour un type de véhicule
     */
    getCodeCategorieForTypeVehicule(typeVehicule: string): string | null {
        return this.TYPE_VEHICULE_TO_CATEGORIE_CODE[typeVehicule] || null;
    }
}
