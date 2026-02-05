import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARTICIPANT', 'ADMIN')
  create(@Body() createReservationDto: CreateReservationDto, @Request() req: any) {
    const userId = req.user.sub;
    return this.reservationsService.create(createReservationDto, userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARTICIPANT', 'ADMIN')
  findMyReservations(@Request() req: any) {
    const userId = req.user.sub;
    return this.reservationsService.findByUserId(userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAll() {
    return this.reservationsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARTICIPANT', 'ADMIN')
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARTICIPANT', 'ADMIN')
  cancel(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.role === 'PARTICIPANT' ? req.user.sub : undefined;
    return this.reservationsService.cancel(id, userId);
  }
}
