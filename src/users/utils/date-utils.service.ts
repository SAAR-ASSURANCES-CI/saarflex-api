import { Injectable, BadRequestException } from '@nestjs/common';

/**
 * Service utilitaire pour la manipulation des dates
 */
@Injectable()
export class DateUtilsService {
    /**
     * Parse une date au format DD-MM-YYYY
     * @param input Chaîne de caractères au format DD-MM-YYYY
     * @returns Date ou null si invalide
     */
    parseDDMMYYYY(input: string): Date | null {
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

    /**
     * Formate une date en DD-MM-YYYY
     * @param date Date à formater
     * @returns Chaîne de caractères au format DD-MM-YYYY
     */
    formatDateDDMMYYYY(date: Date): string {
        const d = new Date(date);
        const day = String(d.getUTCDate()).padStart(2, '0');
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const year = d.getUTCFullYear();
        return `${day}-${month}-${year}`;
    }

    /**
     * Calcule l'âge à partir d'une date de naissance
     * @param birthDate Date de naissance
     * @returns Âge en années
     */
    calculateAge(birthDate: Date): number {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }

    /**
     * Valide qu'une date de naissance est dans le passé
     * @param dateString Date au format DD-MM-YYYY
     * @throws BadRequestException si invalide
     */
    validateBirthDate(dateString: string): Date {
        const parsedDate = this.parseDDMMYYYY(dateString);
        if (!parsedDate) {
            throw new BadRequestException('Format de date de naissance invalide. Utilisez le format DD-MM-YYYY');
        }
        if (parsedDate >= new Date()) {
            throw new BadRequestException('La date de naissance doit être dans le passé');
        }
        return parsedDate;
    }

    /**
     * Valide qu'une date d'expiration est dans le futur
     * @param dateString Date au format DD-MM-YYYY
     * @throws BadRequestException si invalide
     */
    validateExpirationDate(dateString: string): Date {
        const parsedDate = this.parseDDMMYYYY(dateString);
        if (!parsedDate) {
            throw new BadRequestException('Format de date d\'expiration invalide. Utilisez le format DD-MM-YYYY');
        }
        if (parsedDate <= new Date()) {
            throw new BadRequestException('La date d\'expiration de la pièce d\'identité doit être dans le futur');
        }
        return parsedDate;
    }
}

