import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;

      if (!authHeader) {
        throw new UnauthorizedException("Token d'authentification manquant");
      }

      if (info) {
        if (info.name === 'TokenExpiredError') {
          throw new UnauthorizedException(
            'Token expiré. Veuillez vous reconnecter.',
          );
        }
        if (info.name === 'JsonWebTokenError') {
          throw new UnauthorizedException(
            'Token invalide. Veuillez vous reconnecter.',
          );
        }
        throw new UnauthorizedException(info.message || 'Token invalide');
      }

      throw err || new UnauthorizedException('Authentification échouée');
    }
    return user;
  }
}
