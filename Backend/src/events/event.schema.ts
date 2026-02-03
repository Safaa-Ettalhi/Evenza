import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CANCELED = 'CANCELED',
}

export type EventDocument = Event & Document;

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  date!: Date;

  @Prop({ required: true })
  location!: string;

  @Prop({ required: true, min: 1 })
  capacity!: number;

  @Prop({ required: true, enum: EventStatus, default: EventStatus.DRAFT })
  status!: EventStatus;
}

export const EventSchema = SchemaFactory.createForClass(Event);
