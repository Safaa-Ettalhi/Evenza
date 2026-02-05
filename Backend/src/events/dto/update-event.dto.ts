import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create-event.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { EventStatus } from '../event.schema';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @IsOptional()
  @IsEnum(EventStatus, {
    message: 'Le statut doit être DRAFT, PUBLISHED ou CANCELED',
  })
  status?: EventStatus;
}
