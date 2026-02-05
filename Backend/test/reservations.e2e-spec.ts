import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { UsersService } from '../src/users/users.service';

async function ensureTestUsers(usersService: UsersService): Promise<void> {
  const adminEmail = 'admin@evenza.com';
  const participantEmail = 'participant@evenza.com';

  let admin = await usersService.findByEmail(adminEmail);
  if (!admin) {
    try {
      const hashedAdmin = await bcrypt.hash('admin123', 10);
      admin = await usersService.create(adminEmail, hashedAdmin, 'ADMIN');
    } catch (err: unknown) {
      if ((err as { code?: number })?.code !== 11000) throw err;
      admin = await usersService.findByEmail(adminEmail);
    }
  }

  let participant = await usersService.findByEmail(participantEmail);
  if (!participant) {
    try {
      const hashedParticipant = await bcrypt.hash('participant123', 10);
      participant = await usersService.create(
        participantEmail,
        hashedParticipant,
        'PARTICIPANT',
      );
    } catch (err: unknown) {
      if ((err as { code?: number })?.code !== 11000) throw err;
      participant = await usersService.findByEmail(participantEmail);
    }
  }
}

describe('ReservationsController (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let participantToken: string;
  let publishedEventId: string;
  let reservationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.enableCors({
      origin: 'http://localhost:3001',
      credentials: true,
    });
    await app.init();

    const usersService = moduleFixture.get(UsersService);
    await ensureTestUsers(usersService);

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@evenza.com', password: 'admin123' });
    adminToken = adminLoginResponse.body.access_token;

    const participantLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'participant@evenza.com', password: 'participant123' });
    participantToken = participantLoginResponse.body.access_token;

    const createEventResponse = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Event pour Réservation E2E',
        description: 'Description pour test réservation',
        date: '2026-12-31T14:00:00',
        location: 'Salle E2E',
        capacity: 10,
      });

    publishedEventId = createEventResponse.body._id;

    await request(app.getHttpServer())
      .patch(`/events/${publishedEventId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /reservations (Participant)', () => {
    it('devrait créer une réservation pour un événement publié', async () => {
      const createReservationDto = {
        eventId: publishedEventId,
      };

      const response = await request(app.getHttpServer())
        .post('/reservations')
        .set('Authorization', `Bearer ${participantToken}`)
        .send(createReservationDto)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.status).toBe('PENDING');
      expect(response.body.eventId).toBe(publishedEventId);
      reservationId = response.body._id;
    });

    it('devrait refuser la réservation si non authentifié', async () => {
      const createReservationDto = {
        eventId: publishedEventId,
      };

      await request(app.getHttpServer())
        .post('/reservations')
        .send(createReservationDto)
        .expect(401);
    });

    it("devrait refuser la réservation si l'événement n'est pas publié", async () => {
      const draftEventResponse = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Event Draft',
          description: 'Description',
          date: '2026-12-31T14:00:00',
          location: 'Salle',
          capacity: 10,
        });

      const draftEventId = draftEventResponse.body._id;

      await request(app.getHttpServer())
        .post('/reservations')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({ eventId: draftEventId })
        .expect(400);
    });

    it("devrait refuser la réservation si l'événement est complet", async () => {
      const smallEventResponse = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Event Petit',
          description: 'Description',
          date: '2026-12-31T14:00:00',
          location: 'Salle',
          capacity: 1,
        });

      const smallEventId = smallEventResponse.body._id;

      await request(app.getHttpServer())
        .patch(`/events/${smallEventId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const firstReservation = await request(app.getHttpServer())
        .post('/reservations')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({ eventId: smallEventId })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/reservations/${firstReservation.body._id}/confirm`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const secondParticipantEmail = `test-${Date.now()}@example.com`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: secondParticipantEmail,
          password: 'password123',
        })
        .expect(201);

      const secondParticipantLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: secondParticipantEmail,
          password: 'password123',
        });

      expect([200, 201]).toContain(secondParticipantLogin.status);

      const secondToken = secondParticipantLogin.body.access_token;

      await request(app.getHttpServer())
        .post('/reservations')
        .set('Authorization', `Bearer ${secondToken}`)
        .send({ eventId: smallEventId })
        .expect(400);
    });
  });

  describe('GET /reservations/me (Participant)', () => {
    it("devrait retourner les réservations de l'utilisateur connecté", async () => {
      const response = await request(app.getHttpServer())
        .get('/reservations/me')
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it("devrait refuser l'accès si non authentifié", async () => {
      await request(app.getHttpServer()).get('/reservations/me').expect(401);
    });
  });

  describe('GET /reservations (Admin seulement)', () => {
    it('devrait retourner toutes les réservations pour admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it("devrait refuser l'accès si non admin", async () => {
      await request(app.getHttpServer())
        .get('/reservations')
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(403);
    });
  });

  describe('PATCH /reservations/:id/confirm (Admin seulement)', () => {
    it('devrait confirmer une réservation', async () => {
      if (!reservationId) {
        const createResponse = await request(app.getHttpServer())
          .post('/reservations')
          .set('Authorization', `Bearer ${participantToken}`)
          .send({ eventId: publishedEventId });
        reservationId = createResponse.body._id;
      }

      const response = await request(app.getHttpServer())
        .patch(`/reservations/${reservationId}/confirm`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('CONFIRMED');
    });

    it('devrait refuser la confirmation si non admin', async () => {
      const newReservationResponse = await request(app.getHttpServer())
        .post('/reservations')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({ eventId: publishedEventId });

      const newReservationId = newReservationResponse.body._id;

      await request(app.getHttpServer())
        .patch(`/reservations/${newReservationId}/confirm`)
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(403);
    });
  });

  describe('PATCH /reservations/:id/refuse (Admin seulement)', () => {
    it('devrait refuser une réservation', async () => {
      const refuseEventResponse = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Event pour Refuse',
          description: 'Description',
          date: '2026-12-31T14:00:00',
          location: 'Salle',
          capacity: 10,
        });

      const refuseEventId = refuseEventResponse.body._id;

      await request(app.getHttpServer())
        .patch(`/events/${refuseEventId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const newReservationResponse = await request(app.getHttpServer())
        .post('/reservations')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({ eventId: refuseEventId })
        .expect(201);

      const newReservationId = newReservationResponse.body._id;

      const response = await request(app.getHttpServer())
        .patch(`/reservations/${newReservationId}/refuse`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('REFUSED');
    });
  });

  describe('PATCH /reservations/:id/cancel', () => {
    it("devrait permettre à un participant d'annuler sa propre réservation", async () => {
      const cancelEventResponse = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Event pour Cancel',
          description: 'Description',
          date: '2026-12-31T14:00:00',
          location: 'Salle',
          capacity: 10,
        });

      const cancelEventId = cancelEventResponse.body._id;

      await request(app.getHttpServer())
        .patch(`/events/${cancelEventId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const newReservationResponse = await request(app.getHttpServer())
        .post('/reservations')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({ eventId: cancelEventId })
        .expect(201);

      const newReservationId = newReservationResponse.body._id;

      const response = await request(app.getHttpServer())
        .patch(`/reservations/${newReservationId}/cancel`)
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      expect(response.body.status).toBe('CANCELED');
    });

    it("devrait permettre à un admin d'annuler n'importe quelle réservation", async () => {
      const adminCancelEventResponse = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Event pour Admin Cancel',
          description: 'Description',
          date: '2026-12-31T14:00:00',
          location: 'Salle',
          capacity: 10,
        });

      const adminCancelEventId = adminCancelEventResponse.body._id;

      await request(app.getHttpServer())
        .patch(`/events/${adminCancelEventId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const newReservationResponse = await request(app.getHttpServer())
        .post('/reservations')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({ eventId: adminCancelEventId })
        .expect(201);

      const newReservationId = newReservationResponse.body._id;

      const response = await request(app.getHttpServer())
        .patch(`/reservations/${newReservationId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('CANCELED');
    });
  });

  describe('Scénario complet: Réservation → Confirmation', () => {
    it('devrait permettre à un participant de réserver, puis à un admin de confirmer', async () => {
      const eventResponse = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Event Scénario Complet',
          description: 'Description',
          date: '2026-12-31T14:00:00',
          location: 'Salle',
          capacity: 20,
        });

      const eventId = eventResponse.body._id;

      await request(app.getHttpServer())
        .patch(`/events/${eventId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const reservationResponse = await request(app.getHttpServer())
        .post('/reservations')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({ eventId })
        .expect(201);

      const resId = reservationResponse.body._id;
      expect(reservationResponse.body.status).toBe('PENDING');

      const confirmResponse = await request(app.getHttpServer())
        .patch(`/reservations/${resId}/confirm`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(confirmResponse.body.status).toBe('CONFIRMED');

      const myReservationsResponse = await request(app.getHttpServer())
        .get('/reservations/me')
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      const confirmedReservation = myReservationsResponse.body.find(
        (r: any) => r._id === resId,
      );
      expect(confirmedReservation).toBeDefined();
      expect(confirmedReservation.status).toBe('CONFIRMED');
    });
  });
});
