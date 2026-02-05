import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation, ReservationDocument, ReservationStatus } from './reservation.schema';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
  ) {}

  async create(createReservationDto: CreateReservationDto, userId: string): Promise<ReservationDocument> {
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
}
