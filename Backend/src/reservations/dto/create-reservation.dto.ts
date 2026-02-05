import { IsNotEmpty, IsMongoId } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateReservationDto {
  @IsNotEmpty()
  @IsMongoId()
  @Transform(({ value }) => {
    if (typeof value === 'object' && value !== null) {
      return value._id || value.id || value;
    }
    if (typeof value === 'string' && value.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(value);
        return parsed._id || parsed.id || value;
      } catch {
        return value;
      }
    }
    return value;
  })
  eventId!: string;
}
