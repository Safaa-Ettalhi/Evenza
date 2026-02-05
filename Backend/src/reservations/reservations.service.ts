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
    const event = await this.eventsService.findOne(createReservationDto.eventId);
    
    if (event.status !== EventStatus.PUBLISHED) {
      throw new BadRequestException('Seuls les événements publiés peuvent être réservés');
    }

    const confirmedCount = await this.getConfirmedCountForEvent(createReservationDto.eventId);
    if (confirmedCount >= event.capacity) {
      throw new BadRequestException('Cet événement est complet');
    }

    const existingReservation = await this.reservationModel.findOne({
      eventId: createReservationDto.eventId,
      userId: userId,
      status: { $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
    }).exec();

    if (existingReservation) {
      throw new BadRequestException('Vous avez déjà une réservation pour cet événement');
    }

    const reservation = new this.reservationModel({
      ...createReservationDto,
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

  async findOne(id: string): Promise<ReservationDocument> {
    const reservation = await this.reservationModel
      .findById(id)
      .populate('eventId')
      .populate('userId', 'email')
      .exec();

    if (!reservation) {
      throw new NotFoundException('Réservation non trouvée');
    }

    return reservation;
  }

  async confirm(id: string): Promise<ReservationDocument> {
    const reservation = await this.findOne(id);

    if (reservation.status === ReservationStatus.CONFIRMED) {
      throw new BadRequestException('Cette réservation est déjà confirmée');
    }

    if (reservation.status === ReservationStatus.CANCELED || reservation.status === ReservationStatus.REFUSED) {
      throw new BadRequestException('Impossible de confirmer une réservation annulée ou refusée');
    }

    const event = await this.eventsService.findOne(reservation.eventId.toString());
    const confirmedCount = await this.getConfirmedCountForEvent(reservation.eventId.toString());
    
    if (confirmedCount >= event.capacity) {
      throw new BadRequestException('La capacité maximale de l\'événement est atteinte');
    }

    reservation.status = ReservationStatus.CONFIRMED;
    return reservation.save();
  }

  async refuse(id: string): Promise<ReservationDocument> {
    const reservation = await this.findOne(id);

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
    const reservation = await this.findOne(id);
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
