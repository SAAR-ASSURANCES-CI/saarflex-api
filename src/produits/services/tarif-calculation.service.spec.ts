import { Test, TestingModule } from '@nestjs/testing';
import { TarifCalculationService } from './tarif-calculation.service';
import { GrilleTarifaire, StatutGrille } from '../entities/grille-tarifaire.entity';
import { Tarif, TypeCalculTarif } from '../entities/tarif.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TarifCalculationService', () => {
    let service: TarifCalculationService;
    let grilleRepository: Repository<GrilleTarifaire>;
    let tarifRepository: Repository<Tarif>;

    const mockGrilleRepository = () => ({
        findOne: jest.fn(),
    });

    const mockTarifRepository = () => ({
        find: jest.fn(),
        findOne: jest.fn(),
        createQueryBuilder: jest.fn(),
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TarifCalculationService,
                { provide: getRepositoryToken(GrilleTarifaire), useFactory: mockGrilleRepository },
                { provide: getRepositoryToken(Tarif), useFactory: mockTarifRepository },
            ],
        }).compile();

        service = module.get<TarifCalculationService>(TarifCalculationService);
        grilleRepository = module.get<Repository<GrilleTarifaire>>(getRepositoryToken(GrilleTarifaire));
        tarifRepository = module.get<Repository<Tarif>>(getRepositoryToken(Tarif));
    });

    describe('trouverGrilleTarifaireActive', () => {
        it('should return active grille for a product', async () => {
            const mockGrille = { id: 'grille-1', status: StatutGrille.ACTIF };
            (grilleRepository.findOne as jest.Mock).mockResolvedValue(mockGrille);

            const result = await service.trouverGrilleTarifaireActive('prod-1');
            expect(result).toEqual(mockGrille);
        });

        it('should throw NotFoundException if no active grille', async () => {
            (grilleRepository.findOne as jest.Mock).mockResolvedValue(null);
            await expect(service.trouverGrilleTarifaireActive('prod-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('verifierCorrespondanceCriteres', () => {
        it('should return true when all criteria match exactly', () => {
            const attendus = { 'Option': 'Gold', 'Zone': 'Dakar' };
            const fournis = { 'Option': 'Gold', 'Zone': 'Dakar' };
            expect(service.verifierCorrespondanceCriteres(attendus, fournis)).toBe(true);
        });

        it('should return true with case and accent variations (normalization)', () => {
            const attendus = { 'Option Assurance': 'Gold' };
            const fournis = { 'option assurance': 'Gold' };
            expect(service.verifierCorrespondanceCriteres(attendus, fournis)).toBe(true);
        });

        it('should return true for range values (e.g. age)', () => {
            const attendus = { 'Age': '18-30' };
            const fournis = { 'Age': '25' };
            expect(service.verifierCorrespondanceCriteres(attendus, fournis)).toBe(true);
        });

        it('should return false if a criterion is missing', () => {
            const attendus = { 'Option': 'Gold', 'Zone': 'Dakar' };
            const fournis = { 'Option': 'Gold' };
            expect(service.verifierCorrespondanceCriteres(attendus, fournis)).toBe(false);
        });

        it('should return false if values dont match', () => {
            const attendus = { 'Option': 'Gold' };
            const fournis = { 'Option': 'Silver' };
            expect(service.verifierCorrespondanceCriteres(attendus, fournis)).toBe(false);
        });
    });

    describe('calculerPrime', () => {
        it('should return fixed amount for MONTANT_FIXE', () => {
            const tarif = { type_calcul: TypeCalculTarif.MONTANT_FIXE, montant_fixe: 15000 } as Tarif;
            expect(service.calculerPrime(tarif, {})).toBe(15000);
        });

        it('should calculate percentage of Valeur Neuve', () => {
            const tarif = { type_calcul: TypeCalculTarif.POURCENTAGE_VALEUR_NEUVE, taux_pourcentage: 5 } as Tarif;
            const criteres = { 'Valeur à Neuf': 1000000 };
            expect(service.calculerPrime(tarif, criteres)).toBe(50000);
        });

        it('should throw BadRequestException if VN is missing for percentage calculation', () => {
            const tarif = { type_calcul: TypeCalculTarif.POURCENTAGE_VALEUR_NEUVE, taux_pourcentage: 5 } as Tarif;
            expect(() => service.calculerPrime(tarif, {})).toThrow(BadRequestException);
        });

        it('should evaluate custom formula', () => {
            const tarif = {
                type_calcul: TypeCalculTarif.FORMULE_PERSONNALISEE,
                formule_calcul: 'montant_base + (valeur_neuve * 0.02)'
            } as Tarif;
            tarif.montant_fixe = 5000;
            const criteres = { 'valeur_neuve': 100000 };
            // 5000 + (100000 * 0.02) = 5000 + 2000 = 7000
            expect(service.calculerPrime(tarif, criteres)).toBe(7000);
        });
    });
});
