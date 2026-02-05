import { UnauthorizedException } from '@nestjs/common';

export class CustomUnauthorizedException extends UnauthorizedException {
  constructor(message: string) {
    super({ message, error: 'Unauthorized', statusCode: 401 });
  }
}
