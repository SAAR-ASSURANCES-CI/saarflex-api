import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProduitsService } from './produits.service';

@ApiTags('Produits')
@Controller('produits')
export class ProduitsController {
    constructor(private readonly produitsService: ProduitsService) {}
}
