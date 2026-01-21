import { Test, TestingModule } from '@nestjs/testing';
import { SimulationDevisSimplifieeService } from './simulation-devis-simplifie.service';
import { Produit, StatutProduit, TypeProduit } from '../../entities/produit.entity';
import { DevisValidationService } from '../../services/devis-validation.service';
import { TarifCalculationService } from '../../services/tarif-calculation.service';
import { CriteresEnrichmentService } from '../../services/criteres-enrichment.service';
import { DevisCreationService } from '../../services/devis-creation.service';
import { DevisMapperService } from '../../services/devis-mapper.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SimulationDevisSimplifieeService', () => {
    let service: SimulationDevisSimplifieeService;
    let produitRepository: Repository<Produit>;
    let devisValidationService: DevisValidationService;
    let tarifCalculationService: TarifCalculationService;
    let criteresEnrichmentService: CriteresEnrichmentService;
    let devisCreationService: DevisCreationService;
    let devisMapperService: DevisMapperService;

    const mockProduitRepository = () => ({
        findOne: jest.fn(),
    });

    const mockDevisValidationService = () => ({
        validerSouscription: jest.fn(),
    });

    const mockTarifCalculationService = () => ({
        trouverGrilleTarifaireActive: jest.fn(),
        trouverTarifFixe: jest.fn(),
        calculerPrime: jest.fn(),
    });

    const mockCriteresEnrichmentService = () => ({
        enrichirCriteresAvecAge: jest.fn(),
    });

    const mockDevisCreationService = () => ({
        creerDevisSimule: jest.fn(),
    });

    const mockDevisMapperService = () => ({
        mapToResponseDto: jest.fn(),
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SimulationDevisSimplifieeService,
                { provide: getRepositoryToken(Produit), useFactory: mockProduitRepository },
                { provide: DevisValidationService, useFactory: mockDevisValidationService },
                { provide: TarifCalculationService, useFactory: mockTarifCalculationService },
                { provide: CriteresEnrichmentService, useFactory: mockCriteresEnrichmentService },
                { provide: DevisCreationService, useFactory: mockDevisCreationService },
                { provide: DevisMapperService, useFactory: mockDevisMapperService },
            ],
        }).compile();

        service = module.get<SimulationDevisSimplifieeService>(SimulationDevisSimplifieeService);
        produitRepository = module.get<Repository<Produit>>(getRepositoryToken(Produit));
        devisValidationService = module.get<DevisValidationService>(DevisValidationService);
        tarifCalculationService = module.get<TarifCalculationService>(TarifCalculationService);
        criteresEnrichmentService = module.get<CriteresEnrichmentService>(CriteresEnrichmentService);
        devisCreationService = module.get<DevisCreationService>(DevisCreationService);
        devisMapperService = module.get<DevisMapperService>(DevisMapperService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('simulerDevisSimple', () => {
        const simulationDto = {
            produit_id: 'prod-uuid',
            assure_est_souscripteur: true,
            criteres_utilisateur: { 'Option': 'Gold' }
        } as any;

        const mockProduit = {
            id: 'prod-uuid',
            statut: StatutProduit.ACTIF,
            type: TypeProduit.VIE
        } as Produit;

        it('should successfully simulate a quote for an authenticated user', async () => {
            const userId = 'user-uuid';
            const mockGrille = { id: 'grille-uuid' };
            const mockCriteres = { 'Option': 'Gold', 'Age': '30' };
            const mockTarif = { id: 'tarif-uuid' };
            const mockDevis = { id: 'devis-uuid', reference: 'REF123' };
            const mockResponse = { id: 'devis-uuid', reference: 'REF123', prime_calculee: 1000 };

            (produitRepository.findOne as jest.Mock).mockResolvedValue(mockProduit);
            (tarifCalculationService.trouverGrilleTarifaireActive as jest.Mock).mockResolvedValue(mockGrille);
            (criteresEnrichmentService.enrichirCriteresAvecAge as jest.Mock).mockResolvedValue(mockCriteres);
            (tarifCalculationService.trouverTarifFixe as jest.Mock).mockResolvedValue(mockTarif);
            (tarifCalculationService.calculerPrime as jest.Mock).mockReturnValue(1000);
            (devisCreationService.creerDevisSimule as jest.Mock).mockResolvedValue(mockDevis);
            (devisMapperService.mapToResponseDto as jest.Mock).mockResolvedValue(mockResponse);

            const result = await service.simulerDevisSimple(simulationDto, userId);

            expect(produitRepository.findOne).toHaveBeenCalled();
            expect(devisValidationService.validerSouscription).toHaveBeenCalledWith(simulationDto, userId, mockProduit);
            expect(tarifCalculationService.trouverGrilleTarifaireActive).toHaveBeenCalledWith(mockProduit.id);
            expect(criteresEnrichmentService.enrichirCriteresAvecAge).toHaveBeenCalled();
            expect(tarifCalculationService.trouverTarifFixe).toHaveBeenCalledWith(mockGrille.id, mockCriteres);
            expect(devisCreationService.creerDevisSimule).toHaveBeenCalled();
            expect(result).toEqual(mockResponse);
        });

        it('should throw NotFoundException if product is not found or inactive', async () => {
            (produitRepository.findOne as jest.Mock).mockResolvedValue(null);

            await expect(service.simulerDevisSimple(simulationDto, 'uid')).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if simulation for self but not authenticated', async () => {
            (produitRepository.findOne as jest.Mock).mockResolvedValue(mockProduit);

            await expect(service.simulerDevisSimple(simulationDto)).rejects.toThrow(BadRequestException);
        });
    });
});
