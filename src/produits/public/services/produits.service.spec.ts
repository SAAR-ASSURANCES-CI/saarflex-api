import { Test, TestingModule } from '@nestjs/testing';
import { ProduitsService } from './produits.service';
import { Produit, StatutProduit, TypeProduit } from '../../entities/produit.entity';
import { BrancheProduit } from '../../entities/branche-produit.entity';
import { Garantie, StatutGarantie } from '../../entities/garantie.entity';
import { CritereTarification } from '../../entities/critere-tarification.entity';
import { ValeurCritere } from '../../entities/valeur-critere.entity';
import { Tarif } from '../../entities/tarif.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TarifCalculationService } from '../../services/tarif-calculation.service';
import { NotFoundException } from '@nestjs/common';

describe('ProduitsService', () => {
    let service: ProduitsService;
    let produitRepository: Repository<Produit>;

    const mockProduitRepository = () => ({
        find: jest.fn(),
        findOne: jest.fn(),
    });

    const mockBrancheRepository = () => ({
        find: jest.fn(),
    });

    const mockGarantieRepository = () => ({
        find: jest.fn(),
        findOne: jest.fn(),
    });

    const mockCritereRepository = () => ({
        createQueryBuilder: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        }),
    });

    const mockValeurRepository = () => ({
        find: jest.fn(),
    });

    const mockTarifRepository = () => ({
        find: jest.fn(),
    });

    const mockTarifCalculationService = () => ({
        trouverGrilleTarifaireActive: jest.fn(),
        normaliserNomCritere: jest.fn(name => name.toLowerCase()),
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProduitsService,
                { provide: getRepositoryToken(Produit), useFactory: mockProduitRepository },
                { provide: getRepositoryToken(BrancheProduit), useFactory: mockBrancheRepository },
                { provide: getRepositoryToken(Garantie), useFactory: mockGarantieRepository },
                { provide: getRepositoryToken(CritereTarification), useFactory: mockCritereRepository },
                { provide: getRepositoryToken(ValeurCritere), useFactory: mockValeurRepository },
                { provide: getRepositoryToken(Tarif), useFactory: mockTarifRepository },
                { provide: TarifCalculationService, useFactory: mockTarifCalculationService },
            ],
        }).compile();

        service = module.get<ProduitsService>(ProduitsService);
        produitRepository = module.get<Repository<Produit>>(getRepositoryToken(Produit));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all active products', async () => {
            const mockProduits = [
                { id: '1', nom: 'Produit 1', statut: StatutProduit.ACTIF },
                { id: '2', nom: 'Produit 2', statut: StatutProduit.ACTIF },
            ] as Produit[];

            (produitRepository.find as jest.Mock).mockResolvedValue(mockProduits);

            const result = await service.findAll();

            expect(result.length).toBe(2);
            expect(result[0].nom).toBe('Produit 1');
            expect(produitRepository.find).toHaveBeenCalledWith(expect.objectContaining({
                where: { statut: StatutProduit.ACTIF }
            }));
        });
    });

    describe('findOne', () => {
        it('should return a product by ID if active', async () => {
            const mockProduit = { id: 'uuid', nom: 'Produit Test', statut: StatutProduit.ACTIF } as Produit;
            (produitRepository.findOne as jest.Mock).mockResolvedValue(mockProduit);

            const result = await service.findOne('uuid');

            expect(result.id).toBe('uuid');
            expect(result.nom).toBe('Produit Test');
        });

        it('should throw NotFoundException if product not found', async () => {
            (produitRepository.findOne as jest.Mock).mockResolvedValue(null);

            await expect(service.findOne('uuid')).rejects.toThrow(NotFoundException);
        });
    });
});
