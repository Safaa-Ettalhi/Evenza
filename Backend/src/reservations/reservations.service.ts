import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation, ReservationDocument, ReservationStatus } from './reservation.schema';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { EventsService } from '../events/events.service';
import { EventStatus } from '../events/event.schema';
import { CustomNotFoundException } from '../common/exceptions/not-found.exception';
import { CustomBadRequestException } from '../common/exceptions/bad-request.exception';
import { CustomConflictException } from '../common/exceptions/conflict.exception';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
    private eventsService: EventsService,
  ) {}

  async create(createReservationDto: CreateReservationDto, userId: string): Promise<ReservationDocument> {
    const event = await this.eventsService.findOne(createReservationDto.eventId);

    if (event.status !== EventStatus.PUBLISHED) {
      throw new CustomBadRequestException("L'événement n'est pas publié ou a été annulé");
    }

    const existingReservation = await this.reservationModel
      .findOne({
        eventId: event._id,
        userId,
        status: { $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
      })
      .exec();

    if (existingReservation) {
      throw new CustomConflictException('Vous avez déjà une réservation active pour cet événement');
    }

    const confirmedCount = await this.reservationModel
      .countDocuments({
        eventId: event._id,
        status: ReservationStatus.CONFIRMED,
      })
      .exec();

    if (confirmedCount >= event.capacity) {
      throw new CustomConflictException("L'événement est complet");
    }

    const reservation = new this.reservationModel({
      eventId: event._id,
      userId,
      status: ReservationStatus.PENDING,
    });

    return reservation.save();
  }

  async findAll(): Promise<ReservationDocument[]> {
    return this.reservationModel.find().populate('eventId').populate('userId').sort({ createdAt: -1 }).exec();
  }

  async findByEventId(eventId: string): Promise<ReservationDocument[]> {
    return this.reservationModel
      .find({ eventId })
      .populate('eventId')
      .populate('userId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByUserId(userId: string): Promise<ReservationDocument[]> {
    return this.reservationModel
      .find({ userId })
      .populate('eventId')
      .populate('userId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<ReservationDocument> {
    const reservation = await this.reservationModel
      .findById(id)
      .populate('eventId')
      .populate('userId')
      .exec();
    if (!reservation) {
      throw new CustomNotFoundException('Réservation non trouvée');
    }
    return reservation;
  }

  async confirm(id: string): Promise<ReservationDocument> {
    const reservation = await this.findOne(id);

    const event = await this.eventsService.findOne(reservation.eventId.toString());
    const confirmedCount = await this.reservationModel
      .countDocuments({
        eventId: event._id,
        status: ReservationStatus.CONFIRMED,
      })
      .exec();

    if (confirmedCount >= event.capacity) {
      throw new CustomConflictException("L'événement est complet, impossible de confirmer cette réservation");
    }

    reservation.status = ReservationStatus.CONFIRMED;
    return reservation.save();
  }

  async refuse(id: string): Promise<ReservationDocument> {
    const reservation = await this.findOne(id);
    reservation.status = ReservationStatus.REFUSED;
    return reservation.save();
  }

  async cancel(id: string): Promise<ReservationDocument> {
    const reservation = await this.findOne(id);
    reservation.status = ReservationStatus.CANCELED;
    return reservation.save();
  }

  async getConfirmedCountForEvent(eventId: string): Promise<number> {
    return this.reservationModel
      .countDocuments({
        eventId,
        status: ReservationStatus.CONFIRMED,
      })
      .exec();
  }
}
