import { Controller, Post, Get, Param, Body, UseGuards, Request, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../users/jwt/jwt-auth.guard';
import { SouscriptionService } from '../../services/souscription.service';
import { SouscrireDevisDto, SouscriptionResponseDto } from '../../dto/souscription.dto';

/**
 * Contrôleur de souscription
 * Gère le processus de souscription des devis
 */
@ApiTags('Souscription')
@Controller('devis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SouscriptionController {
    private readonly logger = new Logger(SouscriptionController.name);

    constructor(
        private readonly souscriptionService: SouscriptionService,
    ) { }

    /**
     * Souscrire à un devis (initie le paiement)
     */
    @Post(':id/souscrire')
    @ApiOperation({
        summary: 'Souscrire à un devis',
        description: 'Initie le processus de souscription avec paiement pour un devis sauvegardé'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Paiement initié avec succès',
        type: SouscriptionResponseDto
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Devis non trouvé'
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Devis non valide pour souscription ou bénéficiaires manquants'
    })
    async souscrireDevis(
        @Param('id') devisId: string,
        @Body() souscrireDto: SouscrireDevisDto,
        @Request() req: any,
    ): Promise<SouscriptionResponseDto> {

        const utilisateurId = req.user.id;

        const result = await this.souscriptionService.souscrireDevis(
            devisId,
            utilisateurId,
            souscrireDto.methode_paiement,
            souscrireDto.numero_telephone,
            souscrireDto.beneficiaires,
            souscrireDto.currency || 'XOF'
        );

        return {
            paiement_id: result.paiement.id,
            reference_paiement: result.paiement.reference_paiement,
            statut_paiement: result.paiement.statut,
            montant: Number(result.paiement.montant),
            payment_url: result.paiement.payment_url || undefined,
            currency: result.paiement.currency || 'XOF',
            message: result.message
        };
    }

    /**
     * Obtenir l'état d'une souscription
     */
    @Get(':id/etat-souscription')
    @ApiOperation({
        summary: 'Obtenir l\'état d\'une souscription',
        description: 'Récupère l\'état actuel du processus de souscription (devis, paiement, contrat)'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'État de la souscription récupéré avec succès'
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Devis non trouvé'
    })
    async obtenirEtatSouscription(
        @Param('id') devisId: string,
        @Request() req: any,
    ) {
        const utilisateurId = req.user.id;
        return await this.souscriptionService.obtenirEtatSouscription(devisId, utilisateurId);
    }
}

