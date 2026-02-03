import { ForbiddenException } from '@nestjs/common';

export class CustomForbiddenException extends ForbiddenException {
  constructor(message: string) {
    super({ message, error: 'Forbidden', statusCode: 403 });
  }
}