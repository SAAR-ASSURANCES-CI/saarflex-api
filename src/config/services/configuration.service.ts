import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigurationSysteme } from '../entities/configuration-systeme.entity';

/**
 * Service pour gérer les configurations globales du système
 */
@Injectable()
export class ConfigurationService {
    constructor(
        @InjectRepository(ConfigurationSysteme)
        private readonly configRepository: Repository<ConfigurationSysteme>,
    ) { }

    /**
     * Récupère une valeur de configuration par sa clé
     */
    async getConfig(cle: string): Promise<string> {
        const config = await this.configRepository.findOne({ where: { cle } });

        if (!config) {
            throw new NotFoundException(`Configuration avec la clé "${cle}" non trouvée`);
        }

        return config.valeur;
    }

    /**
     * Récupère le code agence configuré
     */
    async getCodeAgence(): Promise<string> {
        return await this.getConfig('code_agence');
    }

    /**
     * Met à jour une valeur de configuration
     */
    async updateConfig(cle: string, valeur: string): Promise<ConfigurationSysteme> {
        const config = await this.configRepository.findOne({ where: { cle } });

        if (!config) {
            throw new NotFoundException(`Configuration avec la clé "${cle}" non trouvée`);
        }

        config.valeur = valeur;
        return await this.configRepository.save(config);
    }

    /**
     * Met à jour le code agence
     */
    async updateCodeAgence(nouveauCode: string): Promise<ConfigurationSysteme> {
        // Validation : le code doit être numérique et faire 3 chiffres
        if (!/^\d{3}$/.test(nouveauCode)) {
            throw new Error('Le code agence doit être composé de 3 chiffres');
        }

        return await this.updateConfig('code_agence', nouveauCode);
    }

    /**
     * Récupère toutes les configurations
     */
    async getAllConfigs(): Promise<ConfigurationSysteme[]> {
        return await this.configRepository.find();
    }
}
