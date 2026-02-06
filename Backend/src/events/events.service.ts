import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument, EventStatus } from './event.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CustomNotFoundException } from '../common/exceptions/not-found.exception';
import {
  Reservation,
  ReservationDocument,
} from '../reservations/reservation.schema';
import { ReservationStatus } from '../reservations/reservation.schema';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Reservation.name)
    private reservationModel: Model<ReservationDocument>,
  ) {}

  async create(
    createEventDto: CreateEventDto,
  ): Promise<EventDocument & { availableSpots: number }> {
    const eventData = {
      ...createEventDto,
      date: new Date(createEventDto.date),
      status: createEventDto.status || EventStatus.DRAFT,
    };
    const event = new this.eventModel(eventData);
    const saved = await event.save();
    return this.addAvailableSpots(saved);
  }

  private async getConfirmedCountForEvent(eventId: string): Promise<number> {
    return this.reservationModel
      .countDocuments({
        eventId,
        status: ReservationStatus.CONFIRMED,
      })
      .exec();
  }

  private async addAvailableSpots(
    event: EventDocument,
  ): Promise<EventDocument & { availableSpots: number }> {
    const confirmedCount = await this.getConfirmedCountForEvent(
      event._id.toString(),
    );
    const eventObj = (event as any).toObject
      ? (event as any).toObject()
      : { ...event };
    return {
      ...eventObj,
      availableSpots: Math.max(0, event.capacity - confirmedCount),
    };
  }

  async findAll(status?: EventStatus): Promise<(EventDocument & { availableSpots: number })[]> {
    const filter = status ? { status } : {};
    const events = await this.eventModel.find(filter).sort({ date: 1 }).exec();
    return Promise.all(events.map((e) => this.addAvailableSpots(e)));
  }

  async findPublished(): Promise<(EventDocument & { availableSpots: number })[]> {
    const events = await this.eventModel
      .find({ status: EventStatus.PUBLISHED })
      .sort({ date: 1 })
      .exec();
    return Promise.all(events.map((e) => this.addAvailableSpots(e)));
  }

  async findOne(id: string): Promise<EventDocument & { availableSpots: number }> {
    const event = await this.eventModel.findById(id).exec();
    if (!event) {
      throw new CustomNotFoundException('Événement non trouvé');
    }
    return this.addAvailableSpots(event);
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
  ): Promise<EventDocument & { availableSpots: number }> {
    const updateData: any = { ...updateEventDto };
    if (updateEventDto.date) {
      updateData.date = new Date(updateEventDto.date);
    }
    const event = await this.eventModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!event) {
      throw new CustomNotFoundException('Événement non trouvé');
    }
    return this.addAvailableSpots(event);
  }

  async publish(id: string): Promise<EventDocument & { availableSpots: number }> {
    const event = await this.eventModel
      .findByIdAndUpdate(id, { status: EventStatus.PUBLISHED }, { new: true })
      .exec();
    if (!event) {
      throw new CustomNotFoundException('Événement non trouvé');
    }
    return this.addAvailableSpots(event);
  }

  async cancel(id: string): Promise<EventDocument & { availableSpots: number }> {
    const event = await this.eventModel
      .findByIdAndUpdate(id, { status: EventStatus.CANCELED }, { new: true })
      .exec();
    if (!event) {
      throw new CustomNotFoundException('Événement non trouvé');
    }
    return this.addAvailableSpots(event);
  }
}
