import { ConflictException } from '@nestjs/common';

export class CustomConflictException extends ConflictException {
  constructor(message: string) {
    super({ message, error: 'Conflict', statusCode: 409 });
  }
}