import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Contrat } from '../entities/contrat.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class AttestationService {
    private readonly logger = new Logger(AttestationService.name);

    async genererAttestationPDF(contrat: Contrat, user: User): Promise<Buffer> {
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

        // Signature digitale fictive (un cadre)
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
}
