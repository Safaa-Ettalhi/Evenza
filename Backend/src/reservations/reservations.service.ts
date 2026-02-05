import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation, ReservationDocument, ReservationStatus } from './reservation.schema';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { EventsService } from '../events/events.service';
import { EventStatus } from '../events/event.schema';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
    private eventsService: EventsService,
  ) {}

  async create(createReservationDto: CreateReservationDto, userId: string): Promise<ReservationDocument> {

    let eventId: string = createReservationDto.eventId;
    
    if (typeof eventId === 'object' && eventId !== null) {
      eventId = (eventId as any)._id?.toString() || (eventId as any).id?.toString() || String(eventId);
    } else if (typeof eventId === 'string' && eventId.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(eventId);
        eventId = parsed._id?.toString() || parsed.id?.toString() || eventId;
      } catch {
      }
    }
    
    if (!eventId || eventId.length !== 24) {
      throw new BadRequestException('ID d\'événement invalide');
    }

    const event = await this.eventsService.findOne(eventId);
    
    if (event.status !== EventStatus.PUBLISHED) {
      throw new BadRequestException('Seuls les événements publiés peuvent être réservés');
    }

    const confirmedCount = await this.getConfirmedCountForEvent(eventId);
    if (confirmedCount >= event.capacity) {
      throw new BadRequestException('Cet événement est complet');
    }

    const existingReservation = await this.reservationModel.findOne({
      eventId: eventId,
      userId: userId,
      status: { $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
    }).exec();

    if (existingReservation) {
      throw new BadRequestException('Vous avez déjà une réservation pour cet événement');
    }

    const reservation = new this.reservationModel({
      eventId: eventId,
      userId,
      status: ReservationStatus.PENDING,
    });

    return reservation.save();
  }

  async getConfirmedCountForEvent(eventId: string): Promise<number> {
    return this.reservationModel.countDocuments({
      eventId,
      status: ReservationStatus.CONFIRMED,
    }).exec();
  }

  async findByUserId(userId: string): Promise<ReservationDocument[]> {
    return this.reservationModel
      .find({ userId })
      .populate('eventId')
      .populate('userId', 'email')
      .exec();
  }

  async findAll(): Promise<ReservationDocument[]> {
    return this.reservationModel
      .find()
      .populate('eventId')
      .populate('userId', 'email')
      .exec();
  }

  async findOne(id: string, populate: boolean = true): Promise<ReservationDocument> {
    let query = this.reservationModel.findById(id);
    
    if (populate) {
      query = query.populate('eventId').populate('userId', 'email');
    }
    
    const reservation = await query.exec();

    if (!reservation) {
      throw new NotFoundException('Réservation non trouvée');
    }

    return reservation;
  }

  async confirm(id: string): Promise<ReservationDocument> {
    const reservation = await this.findOne(id, false);

    if (reservation.status === ReservationStatus.CONFIRMED) {
      throw new BadRequestException('Cette réservation est déjà confirmée');
    }

    if (reservation.status === ReservationStatus.CANCELED || reservation.status === ReservationStatus.REFUSED) {
      throw new BadRequestException('Impossible de confirmer une réservation annulée ou refusée');
    }

    const eventId = reservation.eventId.toString();
    const event = await this.eventsService.findOne(eventId);
    const confirmedCount = await this.getConfirmedCountForEvent(eventId);
    
    if (confirmedCount >= event.capacity) {
      throw new BadRequestException('La capacité maximale de l\'événement est atteinte');
    }

    reservation.status = ReservationStatus.CONFIRMED;
    return reservation.save();
  }

  async refuse(id: string): Promise<ReservationDocument> {
    const reservation = await this.findOne(id, false);

    if (reservation.status === ReservationStatus.REFUSED) {
      throw new BadRequestException('Cette réservation est déjà refusée');
    }

    if (reservation.status === ReservationStatus.CANCELED) {
      throw new BadRequestException('Impossible de refuser une réservation annulée');
    }

    reservation.status = ReservationStatus.REFUSED;
    return reservation.save();
  }

  async cancel(id: string, userId?: string): Promise<ReservationDocument> {
    const reservation = await this.findOne(id, false);
    
    if (userId && reservation.userId.toString() !== userId) {
      throw new BadRequestException('Vous ne pouvez pas annuler cette réservation');
    }

    if (reservation.status === ReservationStatus.CANCELED) {
      throw new BadRequestException('Cette réservation est déjà annulée');
    }

    reservation.status = ReservationStatus.CANCELED;
    return reservation.save();
  }

  async findByEventId(eventId: string): Promise<ReservationDocument[]> {
    return this.reservationModel
      .find({ eventId })
      .populate('eventId')
      .populate('userId', 'email')
      .exec();
  }
}
