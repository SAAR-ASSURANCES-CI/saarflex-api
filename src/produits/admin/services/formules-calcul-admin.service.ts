import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { FormuleCalcul } from '../../entities/formule-calcul.entity';
import { Produit } from '../../entities/produit.entity';
import { 
  CreateFormuleCalculDto, 
  UpdateFormuleCalculDto, 
  FormuleCalculDto, 
  FormuleCalculWithProduitDto,
  FormulesCalculResponseDto,
  FormulesCalculWithProduitResponseDto,
  StatutFormule
} from '../../dto/formule-calcul.dto';

@Injectable()
export class FormulesCalculAdminService {
  constructor(
    @InjectRepository(FormuleCalcul)
    private readonly formuleRepository: Repository<FormuleCalcul>,
    @InjectRepository(Produit)
    private readonly produitRepository: Repository<Produit>
  ) {}

  async create(createFormuleDto: CreateFormuleCalculDto): Promise<FormuleCalculDto> {
    // Vérifier que le produit existe
    const produit = await this.produitRepository.findOne({ 
      where: { id: createFormuleDto.produit_id } 
    });
    if (!produit) {
      throw new NotFoundException('Produit non trouvé');
    }

    // Validation  la formule
    try {
      await this.validateFormule(createFormuleDto.formule, createFormuleDto.variables);
    } catch (error) {
      throw new BadRequestException(`Formule invalide: ${error.message}`);
    }

    const formule = this.formuleRepository.create({
      ...createFormuleDto,
      statut: createFormuleDto.statut || StatutFormule.ACTIF
    });

    const savedFormule = await this.formuleRepository.save(formule);
    return this.mapToDto(savedFormule);
  }

  async findAll(page: number = 1, limit: number = 10): Promise<FormulesCalculResponseDto> {
    const skip = (page - 1) * limit;
    
    const [formules, total] = await this.formuleRepository.findAndCount({
      skip,
      take: limit,
      order: { created_at: 'DESC' }
    });

    const totalPages = Math.ceil(total / limit);

    return {
      formules: formules.map(formule => this.mapToDto(formule)),
      total,
      page,
      limit,
      totalPages
    };
  }

  async findAllByProduit(produitId: string, page: number = 1, limit: number = 10): Promise<FormulesCalculResponseDto> {
    const skip = (page - 1) * limit;
    
    const [formules, total] = await this.formuleRepository.findAndCount({
      where: { produit_id: produitId },
      skip,
      take: limit,
      order: { created_at: 'DESC' }
    });

    const totalPages = Math.ceil(total / limit);

    return {
      formules: formules.map(formule => this.mapToDto(formule)),
      total,
      page,
      limit,
      totalPages
    };
  }

  async findOne(id: string): Promise<FormuleCalculDto> {
    const formule = await this.formuleRepository.findOne({ where: { id } });
    if (!formule) {
      throw new NotFoundException('Formule de calcul non trouvée');
    }
    return this.mapToDto(formule);
  }

  async update(id: string, updateFormuleDto: UpdateFormuleCalculDto): Promise<FormuleCalculDto> {
    const formule = await this.formuleRepository.findOne({ where: { id } });
    if (!formule) {
      throw new NotFoundException('Formule de calcul non trouvée');
    }

    // Si la formule est modifiée, la valider
    if (updateFormuleDto.formule && updateFormuleDto.formule !== formule.formule) {
      try {
        const variables = updateFormuleDto.variables || formule.variables;
        await this.validateFormule(updateFormuleDto.formule, variables);
      } catch (error) {
        throw new BadRequestException(`Formule invalide: ${error.message}`);
      }
    }

    Object.assign(formule, updateFormuleDto);
    const updatedFormule = await this.formuleRepository.save(formule);
    return this.mapToDto(updatedFormule);
  }

  async remove(id: string): Promise<void> {
    const formule = await this.formuleRepository.findOne({ where: { id } });
    if (!formule) {
      throw new NotFoundException('Formule de calcul non trouvée');
    }

    await this.formuleRepository.remove(formule);
  }

  async changeStatus(id: string, statut: StatutFormule): Promise<FormuleCalculDto> {
    const formule = await this.formuleRepository.findOne({ where: { id } });
    if (!formule) {
      throw new NotFoundException('Formule de calcul non trouvée');
    }

    formule.statut = statut;
    const updatedFormule = await this.formuleRepository.save(formule);
    return this.mapToDto(updatedFormule);
  }

  async evaluateFormule(formuleId: string, variables: Record<string, any>): Promise<number> {
    const formule = await this.formuleRepository.findOne({ 
      where: { id: formuleId, statut: StatutFormule.ACTIF } 
    });
    if (!formule) {
      throw new NotFoundException('Formule de calcul non trouvée ou inactive');
    }

    return this.evaluate(formule.formule, { ...formule.variables, ...variables });
  }

  async evaluate(formule: string, variables: Record<string, any>): Promise<number> {
    try {
      // Préparer les variables avec leurs valeurs par défaut
      const preparedVariables: Record<string, any> = {};
      
      for (const [key, config] of Object.entries(variables)) {
        if (typeof config === 'object' && config.default !== undefined) {
          preparedVariables[key] = config.default;
        } else {
          preparedVariables[key] = config;
        }
      }

      // Créer une fonction sécurisée pour évaluer la formule
      const safeEval = this.createSafeEvaluator(preparedVariables);
      const result = safeEval(formule);

      if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
        throw new Error('La formule doit retourner un nombre valide');
      }

      return Math.round(result * 100) / 100; // Arrondir à 2 décimales
    } catch (error) {
      throw new BadRequestException(`Erreur d'évaluation de la formule: ${error.message}`);
    }
  }

  private createSafeEvaluator(variables: Record<string, any>): (formule: string) => number {
    const context = {
      ...variables,
      // Fonctions mathématiques sécurisées
      Math: {
        abs: Math.abs,
        ceil: Math.ceil,
        floor: Math.floor,
        max: Math.max,
        min: Math.min,
        round: Math.round,
        sqrt: Math.sqrt,
        pow: Math.pow
      },
      // Opérateurs conditionnels
      MAX: Math.max,
      MIN: Math.min,
      ABS: Math.abs,
      CEIL: Math.ceil,
      FLOOR: Math.floor,
      ROUND: Math.round,
      SQRT: Math.sqrt,
      POW: Math.pow
    };

    return (formule: string): number => {
      // Remplacement des opérateurs ternaires par des fonctions
      const processedFormule = this.processTernaryOperators(formule);
      
      // Création une fonction à partir de la formule
      const functionBody = `return ${processedFormule};`;
      const evaluator = new Function(...Object.keys(context), functionBody);
      
      return evaluator(...Object.values(context));
    };
  }

  private processTernaryOperators(formule: string): string {

    return formule;
  }

  private async validateFormule(formule: string, variables: Record<string, any>): Promise<void> {
    // Test de validation avec des valeurs par défaut
    try {
      const testVariables: Record<string, any> = {};
      
      for (const [key, config] of Object.entries(variables)) {
        if (typeof config === 'object' && config.default !== undefined) {
          testVariables[key] = config.default;
        } else {
          testVariables[key] = 0; // Valeur par défaut pour les tests
        }
      }

      await this.evaluate(formule, testVariables);
    } catch (error) {
      throw new Error(`Formule invalide: ${error.message}`);
    }
  }

  private mapToDto(formule: FormuleCalcul): FormuleCalculDto {
    return {
      id: formule.id,
      produit_id: formule.produit_id,
      nom: formule.nom,
      formule: formule.formule,
      variables: formule.variables,
      statut: formule.statut as StatutFormule,
      created_at: formule.created_at,
      updated_at: formule.updated_at
    };
  }

  private mapToDtoWithProduit(formule: FormuleCalcul): FormuleCalculWithProduitDto {
    const formuleDto = this.mapToDto(formule);
    
    return {
      ...formuleDto,
      produit: {
        id: formule.produit.id,
        nom: formule.produit.nom,
        type: formule.produit.type,
        branche: formule.produit.branche ? {
          id: formule.produit.branche.id,
          nom: formule.produit.branche.nom,
          type: formule.produit.branche.type
        } : undefined
      }
    };
  }
}
