import { DevisCreationService } from './devis-creation.service';
import { Repository } from 'typeorm';
import { DevisSimule } from '../entities/devis-simule.entity';
import { Profile } from '../../users/entities/profile.entity';
import { Produit, TypeProduit } from '../entities/produit.entity';
import { GrilleTarifaire } from '../entities/grille-tarifaire.entity';
import { CreateSimulationDevisSimplifieeDto } from '../dto/simulation-devis-simplifie.dto';

type MockRepository<T extends object> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('DevisCreationService', () => {
  const now = new Date('2024-11-10T12:00:00Z');
  let service: DevisCreationService;
  let devisRepositoryMock: MockRepository<DevisSimule>;
  let profileRepositoryMock: MockRepository<Profile>;
  let queryBuilderMock: {
    select: jest.Mock;
    where: jest.Mock;
    orderBy: jest.Mock;
    limit: jest.Mock;
    getRawOne: jest.Mock;
  };
  let produit: Produit;

  const simulationDto: CreateSimulationDevisSimplifieeDto = {
    produit_id: 'produit-1',
    criteres_utilisateur: { capital: 1000 },
    assure_est_souscripteur: false,
  };

  const grille: GrilleTarifaire = {
    id: 'grille-1',
  } as unknown as GrilleTarifaire;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);

    queryBuilderMock = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    };

    devisRepositoryMock = {
      create: jest.fn((data) => data),
      save: jest.fn((devis) => Promise.resolve(devis as DevisSimule)),
      createQueryBuilder: jest.fn(() => queryBuilderMock),
    };

    profileRepositoryMock = {
      findOne: jest.fn(),
    };

    produit = {
      id: 'produit-1',
      type: TypeProduit.VIE,
    } as Produit;

    service = new DevisCreationService(
      devisRepositoryMock as unknown as Repository<DevisSimule>,
      profileRepositoryMock as unknown as Repository<Profile>,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('génère une référence unique lors de la création', async () => {
    queryBuilderMock.getRawOne.mockResolvedValueOnce(undefined);

    const result = await service.creerDevisSimule(
      simulationDto,
      produit,
      grille,
      1500,
      { capital: 1000 },
    );

    expect(result.reference).toBe('VIE-20241110-0001');
    expect(devisRepositoryMock.save).toHaveBeenCalledTimes(1);
  });

  it('retente la sauvegarde en cas de duplication de référence', async () => {
    const duplicateError = { code: 'ER_DUP_ENTRY' };

    queryBuilderMock.getRawOne
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ reference: 'VIE-20241110-0001' });

    (devisRepositoryMock.save as jest.Mock)
      .mockRejectedValueOnce(duplicateError)
      .mockImplementationOnce((devis) => Promise.resolve(devis));

    const result = await service.creerDevisSimule(
      simulationDto,
      produit,
      grille,
      1500,
      { capital: 1000 },
    );

    expect(result.reference).toBe('VIE-20241110-0002');
    expect(devisRepositoryMock.save).toHaveBeenCalledTimes(2);
  });
});


