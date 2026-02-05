import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PdfService } from '../pdf/pdf.service';
import { EventsService } from '../events/events.service';

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly pdfService: PdfService,
    private readonly eventsService: EventsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARTICIPANT', 'ADMIN')
  create(@Body() createReservationDto: CreateReservationDto, @Request() req: any) {
    const userId = req.user.sub;
    if (typeof createReservationDto.eventId !== 'string') {
      if (typeof createReservationDto.eventId === 'object' && createReservationDto.eventId !== null) {
        createReservationDto.eventId = (createReservationDto.eventId as any)._id?.toString() || 
                                       (createReservationDto.eventId as any).id?.toString() || 
                                       String(createReservationDto.eventId);
      } else {
        createReservationDto.eventId = String(createReservationDto.eventId);
      }
    }
    
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

  @Get('event/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findByEventId(@Param('eventId') eventId: string) {
    return this.reservationsService.findByEventId(eventId);
  }

  @Patch(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  confirm(@Param('id') id: string) {
    return this.reservationsService.confirm(id);
  }

  @Patch(':id/refuse')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  refuse(@Param('id') id: string) {
    return this.reservationsService.refuse(id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARTICIPANT', 'ADMIN')
  cancel(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.role === 'PARTICIPANT' ? req.user.sub : undefined;
    return this.reservationsService.cancel(id, userId);
  }

  @Get(':id/ticket')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARTICIPANT', 'ADMIN')
  async downloadTicket(@Param('id') id: string, @Request() req: any, @Res() res: Response) {
    const userId = req.user.sub;
    const userRole = req.user.role;

    const reservation = await this.reservationsService.findOne(id, true);

    if (userRole === 'PARTICIPANT') {
      const reservationUserId = typeof reservation.userId === 'object' && reservation.userId !== null
        ? (reservation.userId as any)._id?.toString() || (reservation.userId as any).id?.toString()
        : String(reservation.userId);
      
      if (reservationUserId !== userId) {
        return res.status(403).json({ message: 'Vous n\'avez pas accès à ce ticket' });
      }
    }

    let event: any;
    if (typeof reservation.eventId === 'object' && reservation.eventId !== null) {
      event = reservation.eventId;
    } else {
      const eventIdStr = String(reservation.eventId);
      event = await this.eventsService.findOne(eventIdStr);
    }

    const userEmail = typeof reservation.userId === 'object' && reservation.userId !== null
      ? (reservation.userId as any).email || 'Participant'
      : 'Participant';

    const pdfBuffer = await this.pdfService.generateReservationTicket(
      reservation,
      event,
      userEmail,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-${id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  }
}
