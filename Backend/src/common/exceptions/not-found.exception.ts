import { NotFoundException } from '@nestjs/common';

export class CustomNotFoundException extends NotFoundException {
  constructor(message: string) {
    super({ message, error: 'Not Found', statusCode: 404 });
  }
}