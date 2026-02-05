import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secret-evenza',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload) {
      throw new UnauthorizedException('Token invalide : payload manquant');
    }
    
    if (!payload.email) {
      throw new UnauthorizedException('Token invalide : email manquant dans le payload');
    }
    
    const user = await this.usersService.findByEmail(payload.email);
    if (!user) {
      throw new UnauthorizedException(`Utilisateur non trouvé pour l'email: ${payload.email}`);
    }
   
    return {
      sub: user._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
  }
}
