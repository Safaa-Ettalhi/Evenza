import { BadRequestException } from '@nestjs/common';

export class CustomBadRequestException extends BadRequestException {
  constructor(message: string) {
    super({ message, error: 'Bad Request', statusCode: 400 });
  }
}