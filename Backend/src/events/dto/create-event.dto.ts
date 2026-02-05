import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsInt,
  Min,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { EventStatus } from '../event.schema';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty({ message: 'Le titre est requis' })
  title!: string;

  @IsString()
  @IsNotEmpty({ message: 'La description est requise' })
  description!: string;

  @IsDateString({}, { message: 'La date doit être au format ISO' })
  @IsNotEmpty({ message: 'La date est requise' })
  date!: string;

  @IsString()
  @IsNotEmpty({ message: 'Le lieu est requis' })
  location!: string;

  @IsInt({ message: 'La capacité doit être un nombre entier' })
  @Min(1, { message: 'La capacité doit être au moins de 1' })
  capacity!: number;

  @IsOptional()
  @IsEnum(EventStatus, {
    message: 'Le statut doit être DRAFT, PUBLISHED ou CANCELED',
  })
  status?: EventStatus;
}
