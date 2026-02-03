import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CustomConflictException } from '../common/exceptions/conflict.exception';
import { CustomUnauthorizedException } from '../common/exceptions/unauthorized.exception';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existing = await this.usersService.findByEmail(registerDto.email);
    if (existing) {
      throw new CustomConflictException('Cet email est déjà utilisé');
    }
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.create(
      registerDto.email,
      hashedPassword,
      'PARTICIPANT',
    );
    return { message: 'Inscription réussie', userId: user._id };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new CustomUnauthorizedException('Email ou mot de passe incorrect');
    }
    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new CustomUnauthorizedException('Email ou mot de passe incorrect');
    }
    const payload = { sub: user._id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);
    return { access_token: token };
  }
}
