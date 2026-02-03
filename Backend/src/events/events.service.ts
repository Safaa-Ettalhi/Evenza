import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument, EventStatus } from './event.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CustomNotFoundException } from '../common/exceptions/not-found.exception';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
  ) {}

  async create(createEventDto: CreateEventDto): Promise<EventDocument> {
    const eventData = {
      ...createEventDto,
      date: new Date(createEventDto.date),
      status: createEventDto.status || EventStatus.DRAFT,
    };
    const event = new this.eventModel(eventData);
    return event.save();
  }

  async findAll(status?: EventStatus): Promise<EventDocument[]> {
    const filter = status ? { status } : {};
    return this.eventModel.find(filter).sort({ date: 1 }).exec();
  }

  async findPublished(): Promise<EventDocument[]> {
    return this.eventModel.find({ status: EventStatus.PUBLISHED }).sort({ date: 1 }).exec();
  }

  async findOne(id: string): Promise<EventDocument> {
    const event = await this.eventModel.findById(id).exec();
    if (!event) {
      throw new CustomNotFoundException('Événement non trouvé');
    }
    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<EventDocument> {
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
    return event;
  }
}
