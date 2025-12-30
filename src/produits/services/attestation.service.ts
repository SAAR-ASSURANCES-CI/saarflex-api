import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { Contrat } from '../entities/contrat.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class AttestationService {
    private readonly logger = new Logger(AttestationService.name);

    async genererAttestationPDF(contrat: Contrat, user: User): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: any[] = [];
            const doc = new (PDFDocument as any)({
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
        doc
            .fillColor('#444444')
            .fontSize(20)
            .text('SAAR ASSURANCES CI', 110, 57)
            .fontSize(10)
            .text('SAAR ASSURANCES CI', 200, 50, { align: 'right' })
            .text('7eme Tranche, Cocody II Plateaux Aghien', 200, 65, { align: 'right' })
            .text('Abidjan, Côte d\'Ivoire', 200, 80, { align: 'right' })
            .text('Tél: +225 27 22 50 81 50', 200, 95, { align: 'right' })
            .moveDown();
    }

    private generateTitle(doc: PDFKit.PDFDocument) {
        doc
            .fillColor('#E53E3E')
            .fontSize(18)
            .text('ATTESTATION DE SOUSCRIPTION', 0, 160, { align: 'center' })
            .moveDown();

        doc
            .fillColor('#444444')
            .fontSize(10)
            .font('Helvetica-Oblique')
            .text('Ceci est une preuve de souscription et ne remplace pas le contrat officiel.', { align: 'center' })
            .font('Helvetica')
            .moveDown(2);
    }

    private generateSubscriberInfo(doc: PDFKit.PDFDocument, user: User, contrat: Contrat) {
        const infoAssure = contrat.informations_assure as any;

        doc
            .fillColor('#333333')
            .fontSize(12)
            .text('INFORMATIONS DU SOUSCRIPTEUR', { underline: true })
            .moveDown(0.5);

        const startY = doc.y;

        doc
            .fontSize(10)
            .text(`Nom complet: ${user.nom}`, 50, startY)
            .text(`Email: ${user.email}`, 50, startY + 15)
            .text(`Téléphone: ${user.telephone || 'Non renseigné'}`, 50, startY + 30);

        if (contrat.assure_est_souscripteur) {
            doc.text('Statut: Souscripteur et Assuré', 50, startY + 45);
        } else if (infoAssure) {
            doc.text(`Assuré: ${infoAssure.nom} ${infoAssure.prenoms || ''}`, 50, startY + 45);
        }

        doc.moveDown(2);
    }

    private generateContractDetails(doc: PDFKit.PDFDocument, contrat: Contrat) {
        doc
            .fillColor('#333333')
            .fontSize(12)
            .text('DÉTAILS DE LA SOUSCRIPTION', { underline: true })
            .moveDown(0.5);

        const tableTop = doc.y;

        // Dessiner un tableau simple
        this.generateTableRow(doc, tableTop, 'Référence Contrat', contrat.numero_contrat);
        this.generateTableRow(doc, tableTop + 20, 'Produit', contrat.produit?.nom || 'N/A');
        this.generateTableRow(doc, tableTop + 40, 'Date de début', new Date(contrat.date_debut_couverture).toLocaleDateString('fr-FR'));
        this.generateTableRow(doc, tableTop + 60, 'Montant de la prime', `${Number(contrat.prime_mensuelle).toLocaleString('fr-FR')} FCFA`);
        this.generateTableRow(doc, tableTop + 80, 'Périodicité', contrat.periodicite_paiement || 'Annuelle');

        doc.moveDown(3);
    }

    private generateTableRow(doc: PDFKit.PDFDocument, y: number, label: string, value: string) {
        doc
            .fontSize(10)
            .text(label, 50, y)
            .text(value, 200, y);

        doc
            .moveTo(50, y + 15)
            .lineTo(550, y + 15)
            .strokeColor('#EEEEEE')
            .stroke();
    }

    private generateFooter(doc: PDFKit.PDFDocument) {
        doc
            .fontSize(10)
            .text(
                'Fait à Abidjan, le ' + new Date().toLocaleDateString('fr-FR'),
                50,
                700,
                { align: 'center', width: 500 }
            );

        doc
            .fontSize(8)
            .fillColor('#888888')
            .text(
                'SAAR ASSURANCES CI - www.saarassurancesci.com - saarci@saar-assurances.com',
                50,
                750,
                { align: 'center', width: 500 }
            );
    }
}
