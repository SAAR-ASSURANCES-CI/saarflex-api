import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Contrat } from '../entities/contrat.entity';
import { User } from '../../users/entities/user.entity';
import { ProfileService } from '../../users/services/profile.service';
import { ProfileDto } from '../../users/dto/profile.dto';

@Injectable()
export class AttestationService {
    private readonly logger = new Logger(AttestationService.name);

    constructor(
        private readonly profileService: ProfileService,
    ) { }

    async genererAttestationPDF(contrat: Contrat, user: User): Promise<Buffer> {
        // Détecter si c'est un produit voyage
        const nomProduit = (contrat.produit?.nom || '').toUpperCase();
        if (nomProduit.includes('VOYAGE') || nomProduit.includes('TRAVEL') || nomProduit.includes('VOYAGES')) {
            return this.genererAttestationVoyagePDF(contrat, user);
        }

        return new Promise((resolve, reject) => {
            const chunks: any[] = [];
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4',
            });

            doc.on('data', (chunk: any) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err: any) => reject(err));

            // En-tête avec infos de la compagnie
            this.generateHeader(doc);

            // Titre du document
            this.generateTitle(doc);

            // Informations du souscripteur
            this.generateSubscriberInfo(doc, user, contrat);

            // Détails du contrat
            this.generateContractDetails(doc, contrat);

            // Footer
            this.generateFooter(doc);

            doc.end();
        });
    }

    private generateHeader(doc: PDFKit.PDFDocument) {
        // Bandeau supérieur rouge
        doc.rect(0, 0, 600, 20).fill('#E53E3E');

        // Logo / Nom de la compagnie
        doc
            .fillColor('#1A202C')
            .fontSize(22)
            .font('Helvetica-Bold')
            .text('SAAR', 50, 45)
            .fillColor('#E53E3E')
            .text('ASSURANCES CI', 115, 45);

        doc
            .fillColor('#4A5568')
            .fontSize(9)
            .font('Helvetica')
            .text('L\'assurance qui vous comprend', 50, 70);

        // Infos contact à droite
        doc
            .fillColor('#2D3748')
            .fontSize(8)
            .text('Abidjan, Cocody II Plateaux Aghien', 400, 45, { align: 'right' })
            .text('Tél: +225 27 22 50 81 50', 400, 57, { align: 'right' })
            .text('Email: saarci@saar-assurances.com', 400, 69, { align: 'right' })
            .text('www.saarassurancesci.com', 400, 81, { align: 'right' });

        // Ligne de séparation
        doc
            .moveTo(50, 110)
            .lineTo(550, 110)
            .strokeColor('#E2E8F0')
            .lineWidth(0.5)
            .stroke();
    }

    private generateTitle(doc: PDFKit.PDFDocument) {
        doc
            .fillColor('#1A202C')
            .fontSize(24)
            .font('Helvetica-Bold')
            .text('ATTESTATION DE SOUSCRIPTION', 50, 140, { align: 'center' });

        doc
            .fillColor('#E53E3E')
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('N° CERTIFICAT : ' + Math.random().toString(36).substring(2, 10).toUpperCase(), 50, 170, { align: 'center' });

        doc.moveDown(2);
    }

    private generateSubscriberInfo(doc: PDFKit.PDFDocument, user: User, contrat: Contrat) {
        const infoAssure = contrat.informations_assure as any;

        // Bloc Fond Gris
        doc.rect(50, doc.y, 500, 85).fill('#F7FAFC');

        doc
            .fillColor('#E53E3E')
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('   COORDONNÉES DU SOUSCRIPTEUR', 70, doc.y + 10);

        const startY = doc.y + 10;

        doc
            .fillColor('#4A5568')
            .fontSize(10)
            .font('Helvetica')
            .text('Nom & Prénoms :', 80, startY)
            .font('Helvetica-Bold')
            .fillColor('#2D3748')
            .text((user.nom || 'Client').toUpperCase(), 180, startY);

        doc
            .font('Helvetica')
            .fillColor('#4A5568')
            .text('Email :', 80, startY + 18)
            .fillColor('#2D3748')
            .text(user.email, 180, startY + 18);

        doc
            .font('Helvetica')
            .fillColor('#4A5568')
            .text('Téléphone :', 80, startY + 36)
            .fillColor('#2D3748')
            .text(user.telephone || 'Non renseigné', 180, startY + 36);

        if (!contrat.assure_est_souscripteur && infoAssure) {
            doc
                .font('Helvetica')
                .fillColor('#4A5568')
                .text('Assuré désigné :', 320, startY)
                .fillColor('#2D3748')
                .font('Helvetica-Bold')
                .text(`${infoAssure.nom} ${infoAssure.prenoms || ''}`, 405, startY);
        }

        doc.text('', 50, startY + 60);
        doc.moveDown(2);
    }

    private generateContractDetails(doc: PDFKit.PDFDocument, contrat: Contrat) {
        doc
            .fillColor('#1A202C')
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('CARACTÉRISTIQUES DE LA SOUSCRIPTION', 50, doc.y);

        doc.moveDown(0.5);

        const tableTop = doc.y;

        // Entête de tableau stylisé
        doc.rect(50, tableTop, 500, 20).fill('#2D3748');
        doc.fillColor('#FFFFFF').fontSize(9).text('LIBELLE', 70, tableTop + 6);
        doc.text('INFORMATIONS RELATIVES AU CONTRAT', 200, tableTop + 6, { align: 'left' });

        let currentY = tableTop + 20;

        const details = [
            { label: 'Référence Contrat', value: contrat.numero_contrat },
            { label: 'Produit Souscrit', value: contrat.produit?.nom || 'N/A' },
            { label: 'Date d\'Effet', value: new Date(contrat.date_debut_couverture).toLocaleDateString('fr-FR') },
            // { label: 'Date d\'Échéance', value: new Date(contrat.date_fin_couverture).toLocaleDateString('fr-FR') },
            { label: 'Montant Prime', value: `${Number(contrat.prime_mensuelle).toLocaleString('fr-FR')} FCFA` },
            { label: 'Mode Paiement', value: (contrat.periodicite_paiement || 'Mensuel').toUpperCase() },
        ];

        details.forEach((item, index) => {
            const isEven = index % 2 === 0;
            if (isEven) {
                doc.rect(50, currentY, 500, 20).fill('#F7FAFC');
            }

            doc
                .fillColor('#4A5568')
                .fontSize(9)
                .font('Helvetica')
                .text(item.label, 70, currentY + 6)
                .fillColor('#1A202C')
                .font('Helvetica-Bold')
                .text(item.value, 200, currentY + 6);

            currentY += 20;
        });

        doc.moveDown(3);
    }

    private generateTableRow(doc: PDFKit.PDFDocument, y: number, label: string, value: string) {
    }

    private generateFooter(doc: PDFKit.PDFDocument) {
        const bottomY = 650;

        // Cachet et Signature
        doc
            .fillColor('#2D3748')
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('POUR LA COMPAGNIE', 380, bottomY, { align: 'center' });

        doc
            .fontSize(8)
            .font('Helvetica-Oblique')
            .text('Document généré électroniquement', 380, bottomY + 15, { align: 'center' });

        // Signature digitale
        doc.rect(380, bottomY + 30, 120, 40).strokeColor('#E2E8F0').stroke();

        // Footer légal
        doc
            .fillColor('#A0AEC0')
            .fontSize(8)
            .font('Helvetica')
            .text(
                'SAAR ASSURANCES CÔTE D\'IVOIRE - S.A au capital de 5.000.000.000 FCFA - Siège social: Abidjan, Cocody II Plateaux Aghien',
                50,
                750,
                { align: 'center', width: 500 }
            );

        doc.text('Tél: +225 27 22 50 81 50', { align: 'center' });
        doc.text('Email: saarci@saar-assurances.com', { align: 'center' });
        doc.text('www.saarassurancesci.com', { align: 'center' });
    }

    /**
     * Génère l'attestation spécifique pour l'assurance voyage
     */
    private async genererAttestationVoyagePDF(contrat: Contrat, user: User): Promise<Buffer> {
        // Récupérer le profil complet de l'utilisateur
        const profile = await this.profileService.getProfile(user.id);

        return new Promise((resolve, reject) => {
            const chunks: any[] = [];
            const doc = new PDFDocument({
                margin: 40,
                size: 'A4',
            });

            doc.on('data', (chunk: any) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err: any) => reject(err));

            const criteres = contrat.criteres_utilisateur || {};

            // Extraction sémantique des données essentielles depuis les critères
            // Si pas trouvé dans les critères, on prend dans le profil
            const destination = this.extraireValeurParMotsCles(criteres, ['pays', 'zone', 'destination', 'lieu']);
            const passport = this.extraireValeurParMotsCles(criteres, ['passport', 'passeport']) || profile.numero_piece_identite;
            const expirationPassport = this.extraireValeurParMotsCles(criteres, ['expire', 'expiration', 'validite']) || profile.date_expiration_piece_identite;
            const dureeSejour = this.extraireValeurParMotsCles(criteres, ['duree', 'sejour', 'jours', 'quantieme']);

            // --- Construction du PDF Voyage (Page 1) ---
            this.generateVoyageHeader(doc);
            this.generateVoyageIntro(doc, user, contrat);
            this.generateVoyageParticipantTable(doc, user, profile, passport ?? 'N/A', expirationPassport ?? 'N/A');
            this.generateVoyageTripTable(doc, contrat, destination, dureeSejour);
            this.generateVoyageGuarantees(doc, destination);

            // Page 2 (Dispositions spéciales et signature)
            doc.addPage();
            this.generateVoyageHeader(doc);
            this.generateVoyageSpecialDispositions(doc, contrat);

            doc.end();
        });
    }

    private generateVoyageHeader(doc: PDFKit.PDFDocument) {
        doc.rect(50, 40, 500, 30).fill('#0088CC'); // Bleu entête voyage
        doc.fillColor('#FFFFFF').fontSize(14).font('Helvetica-Bold').text('Attestation d\'Assistance Au Voyage', 50, 50, { align: 'center' });
        doc.moveDown(2);
    }

    private generateVoyageIntro(doc: PDFKit.PDFDocument, user: User, contrat: Contrat) {
        doc.fillColor('#000000').fontSize(10).font('Helvetica').moveDown(1);
        const introText = `Nous Soussignés, SAAR ASSURANCE COTE D'IVOIRE (SAAR-CI) dont le siège est à Deux plateaux Aghien, 01 BP 12201 Abidjan 01, attestons par la présente que :`;
        doc.text(introText, { align: 'center', width: 480 });
        doc.moveDown(1);
    }

    private generateVoyageParticipantTable(doc: PDFKit.PDFDocument, user: User, profile: ProfileDto, passport: string, expiration: string) {
        const nomComplet = (user.nom || '').toUpperCase();

        doc.rect(50, doc.y, 500, 70).fill('#F2F2F2');
        doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
        doc.text(`   Mme, Melle, Mr : ${nomComplet}`, 70, doc.y + 10);

        doc.fontSize(9).font('Helvetica').fillColor('#333333');
        const nextY = doc.y + 5;
        doc.text(`Adresse : ${profile.adresse || 'ABIDJAN'}`, 70, nextY);
        doc.text(`Ville : ${profile.lieu_naissance || 'Abidjan'}`, 70, nextY + 12);

        const dateNaiss = profile.date_naissance || 'N/A';
        doc.text(`Informations pers. : Né(e) le : ${dateNaiss}  -  sexe : ${profile.sexe || 'Masculin'}`, 70, nextY + 24);
        doc.text(`Passport N° : ${passport || 'N/A'}  -  Expire le : ${expiration}`, 150, nextY + 36);

        doc.moveDown(4);
    }

    private generateVoyageTripTable(doc: PDFKit.PDFDocument, contrat: Contrat, destination: string, duree: string) {
        const tableY = doc.y;
        doc.rect(50, tableY, 500, 15).fill('#CCCCCC');
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
        doc.text('Pays ou Zone destination', 50, tableY + 3, { width: 200, align: 'center' });
        doc.text('Date Début', 250, tableY + 3, { width: 150, align: 'center' });
        doc.text('Date Fin', 400, tableY + 3, { width: 150, align: 'center' });

        const rowY = tableY + 15;
        doc.rect(50, rowY, 500, 15).stroke();
        doc.font('Helvetica').text(destination || 'N/A', 50, rowY + 3, { width: 200, align: 'center' });
        doc.text(new Date(contrat.date_debut_couverture).toLocaleDateString('fr-FR'), 250, rowY + 3, { width: 150, align: 'center' });
        doc.text(new Date(contrat.date_fin_couverture).toLocaleDateString('fr-FR'), 400, rowY + 3, { width: 150, align: 'center' });

        doc.moveDown(1);
        doc.font('Helvetica-Bold').text(`La durée de séjour ne doit pas dépasser ${duree || 'la durée du contrat'}.`, 50, doc.y);
        doc.font('Helvetica').text(`Est assuré(e) par notre compagnie au titre du Police N° : ${contrat.numero_contrat} valable du ${new Date(contrat.date_debut_couverture).toLocaleDateString('fr-FR')} Au ${new Date(contrat.date_fin_couverture).toLocaleDateString('fr-FR')}.`, 50, doc.y + 12);
        doc.moveDown(2);
    }

    private generateVoyageGuarantees(doc: PDFKit.PDFDocument, destination: string) {
        doc.font('Helvetica-Bold').fontSize(10).text('Principales Garanties :', 50, doc.y);
        doc.moveDown(0.5);

        const startY = doc.y;
        doc.rect(50, startY, 500, 15).fill('#0088CC');
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
        doc.text('PRINCIPALES GARANTIES', 60, startY + 4);
        doc.text('LIMITES / PLAFONDS', 400, startY + 4);

        let currentY = startY + 15;
        doc.fillColor('#000000').font('Helvetica');

        const guarantees = [
            { label: 'SECTION A : ASSISTANCE MÉDICALE ET D\'URGENCE', isTitle: true },
            { label: '- Frais médicaux et hospitalisation à l\'étranger', value: '19 740 000 FCFA' },
            { label: '- Transport ou rapatriement en cas de maladie', value: 'Frais réels' },
            { label: '- Soins dentaires d\'urgence', value: '295 200 FCFA' },
            { label: 'SECTION B : ASSISTANCE PERSONNELLE', isTitle: true },
            { label: '- Services d\'assistance 24H/24', value: 'Couvert' },
            { label: '- Transmission de messages urgents', value: 'Illimité' },
            { label: 'SECTION C : PERTES ET RETARDS', isTitle: true },
            { label: '- Perte de Passeport, Pièce d\'identité', value: '131 200 FCFA' },
            { label: '- Indemnité pour arrivée en retard de bagages', value: '131 200 FCFA' },
            { label: 'SECTION D : ACCIDENT PERSONNEL', isTitle: true },
            { label: '- Décès à bord d\'un moyen de transport', value: '6 560 000 FCFA' },
            { label: '- Invalidité Totale Permanente', value: '6 560 000 FCFA' },
        ];

        guarantees.forEach((g, index) => {
            if (g.isTitle) {
                doc.rect(50, currentY, 500, 12).fill('#EEEEEE');
                doc.fillColor('#000000').font('Helvetica-Bold').fontSize(7).text(g.label, 60, currentY + 3);
            } else {
                doc.fillColor('#333333').font('Helvetica').fontSize(7).text(g.label, 65, currentY + 3);
                if (g.value) doc.text(g.value, 400, currentY + 3);
                // Ligne de séparation
                doc.moveTo(50, currentY + 12).lineTo(550, currentY + 12).strokeColor('#F0F0F0').lineWidth(0.5).stroke();
            }
            currentY += 12;
        });

        doc.moveDown(1);
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(9);
        doc.text(`La garantie s'applique dans les pays de : ${destination || 'MONDE'}.`, 50, currentY + 5);

        doc.moveDown(1);
        doc.font('Helvetica').fontSize(8);
        doc.text('Il est rappelé, en cas d\'urgence, de contacter :', 50, doc.y);
        doc.font('Helvetica-Bold').text('Centre d\'Appel disponible 24heures/24, 7jours/7 au numéros ci-dessous:', 50, doc.y + 2);
    }

    private generateVoyageSpecialDispositions(doc: PDFKit.PDFDocument, contrat: Contrat) {
        doc.fontSize(11).font('Helvetica-Bold').text('Disposition Spéciale :', 50, doc.y);
        doc.fontSize(9).font('Helvetica').moveDown(0.5);
        const text = `L'assuré reconnait avoir reçu les Conditions Générales du contrat...\n\nFait à Abidjan, le ${new Date().toLocaleDateString('fr-FR')}`;
        doc.text(text, { width: 500 });

        doc.moveDown(4);
        doc.text('Pour l\'assuré :', 50, doc.y);
        doc.text('Pour la compagnie :', 350, doc.y);
    }

    /**
     * Extrait une valeur des critères en utilisant des mots-clés sémantiques
     */
    private extraireValeurParMotsCles(criteres: Record<string, any>, motsCles: string[]): string {
        for (const [key, value] of Object.entries(criteres)) {
            const keyNormalisee = this.normaliserNomCritere(key);
            for (const mot of motsCles) {
                if (keyNormalisee.includes(this.normaliserNomCritere(mot))) {
                    return value?.toString() || '';
                }
            }
        }
        return '';
    }

    /**
     * Normalise un texte pour la recherche sémantique
     */
    private normaliserNomCritere(nom: string): string {
        if (!nom) return '';
        return nom
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }
}
