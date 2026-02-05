import { Injectable } from '@nestjs/common';
import { EventsService } from '../events/events.service';
import { ReservationsService } from '../reservations/reservations.service';
import { EventStatus } from '../events/event.schema';
import { ReservationStatus } from '../reservations/reservation.schema';

export interface AdminStats {
  upcomingEvents: number;
  totalEvents: number;
  publishedEvents: number;
  draftEvents: number;
  canceledEvents: number;
  totalReservations: number;
  confirmedReservations: number;
  pendingReservations: number;
  refusedReservations: number;
  canceledReservations: number;
  averageFillRate: number;
  reservationsByStatus: {
    CONFIRMED: number;
    PENDING: number;
    REFUSED: number;
    CANCELED: number;
  };
}

@Injectable()
export class AdminService {
  constructor(
    private readonly eventsService: EventsService,
    private readonly reservationsService: ReservationsService,
  ) {}

  async getStats(): Promise<AdminStats> {
    const now = new Date();

    const allEvents = await this.eventsService.findAll();

    const upcomingEvents = allEvents.filter(
      (event) =>
        new Date(event.date) >= now && event.status === EventStatus.PUBLISHED,
    ).length;

    const publishedEvents = allEvents.filter(
      (e) => e.status === EventStatus.PUBLISHED,
    ).length;
    const draftEvents = allEvents.filter(
      (e) => e.status === EventStatus.DRAFT,
    ).length;
    const canceledEvents = allEvents.filter(
      (e) => e.status === EventStatus.CANCELED,
    ).length;

    const allReservations = await this.reservationsService.findAll();

    const confirmedReservations = allReservations.filter(
      (r) => r.status === ReservationStatus.CONFIRMED,
    ).length;
    const pendingReservations = allReservations.filter(
      (r) => r.status === ReservationStatus.PENDING,
    ).length;
    const refusedReservations = allReservations.filter(
      (r) => r.status === ReservationStatus.REFUSED,
    ).length;
    const canceledReservations = allReservations.filter(
      (r) => r.status === ReservationStatus.CANCELED,
    ).length;

    let totalFillRate = 0;
    let eventsWithReservations = 0;

    for (const event of allEvents) {
      if (event.status === EventStatus.PUBLISHED) {
        const confirmedCount =
          await this.reservationsService.getConfirmedCountForEvent(
            event._id.toString(),
          );
        if (event.capacity > 0) {
          const fillRate = (confirmedCount / event.capacity) * 100;
          totalFillRate += fillRate;
          eventsWithReservations++;
        }
      }
    }

    const averageFillRate =
      eventsWithReservations > 0
        ? Math.round((totalFillRate / eventsWithReservations) * 10) / 10
        : 0;

    return {
      upcomingEvents,
      totalEvents: allEvents.length,
      publishedEvents,
      draftEvents,
      canceledEvents,
      totalReservations: allReservations.length,
      confirmedReservations,
      pendingReservations,
      refusedReservations,
      canceledReservations,
      averageFillRate,
      reservationsByStatus: {
        CONFIRMED: confirmedReservations,
        PENDING: pendingReservations,
        REFUSED: refusedReservations,
        CANCELED: canceledReservations,
      },
    };
  }
}
