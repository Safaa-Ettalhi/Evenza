import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { ReservationDocument } from '../reservations/reservation.schema';
import { EventDocument } from '../events/event.schema';

@Injectable()
export class PdfService {
  async generateReservationTicket(
    reservation: ReservationDocument,
    event: EventDocument,
    userEmail: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .text('Evenza', { align: 'center' })
          .moveDown(0.5);

        doc
          .fontSize(18)
          .font('Helvetica-Bold')
          .text('TICKET DE RÉSERVATION', { align: 'center' })
          .moveDown(1);

        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .text('Événement', { underline: true })
          .moveDown(0.3);

        doc
          .fontSize(14)
          .font('Helvetica')
          .text(`Titre: ${event.title}`)
          .moveDown(0.2)
          .text(`Description: ${event.description}`)
          .moveDown(0.2)
          .text(`Date: ${new Date(event.date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })} à ${new Date(event.date).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}`)
          .moveDown(0.2)
          .text(`Lieu: ${event.location}`)
          .moveDown(1);

        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .text('Informations de réservation', { underline: true })
          .moveDown(0.3);

        doc
          .fontSize(14)
          .font('Helvetica')
          .text(`Participant: ${userEmail}`)
          .moveDown(0.2)
          .text(`Statut: ${this.getStatusLabel(reservation.status)}`)
          .moveDown(0.2)
          .text(`Date de réservation: ${(reservation as any).createdAt ? new Date((reservation as any).createdAt).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }) : 'N/A'}`)
          .moveDown(1);

        const codeText = `Code de réservation: ${reservation._id.toString()}`;
        const currentY = doc.y;
        
        doc
          .fontSize(12)
          .font('Helvetica')
          .fillColor('#000000');
        
        const textWidth = doc.widthOfString(codeText);
        const textHeight = doc.heightOfString(codeText, { width: doc.page.width - 100 });
        const x = (doc.page.width - textWidth) / 2;
        
        doc
          .rect(x - 10, currentY - 5, textWidth + 20, textHeight + 10)
          .fillColor('#f0f0f0')
          .fill()
          .fillColor('#000000');
        
        doc
          .text(codeText, x, currentY)
          .moveDown(1);

        doc
          .fontSize(10)
          .font('Helvetica-Oblique')
          .text('Veuillez présenter ce ticket à l\'entrée de l\'événement.', {
            align: 'center',
          })
          .moveDown(0.5);

        doc
          .fontSize(10)
          .font('Helvetica')
          .text('Merci de votre participation !', { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      REFUSED: 'Refusée',
      CANCELED: 'Annulée',
    };
    return labels[status] || status;
  }
}
