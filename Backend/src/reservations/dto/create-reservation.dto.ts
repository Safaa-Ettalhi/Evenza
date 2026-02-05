import { IsNotEmpty, IsMongoId } from 'class-validator';

export class CreateReservationDto {
  @IsMongoId({ message: "L'ID de l'événement doit être valide" })
  @IsNotEmpty({ message: "L'ID de l'événement est requis" })
  eventId!: string;
}
