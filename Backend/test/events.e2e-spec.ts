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

describe('EventsController (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let participantToken: string;
  let createdEventId: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /events (Admin seulement)', () => {
    it("devrait créer un événement en tant qu'admin", async () => {
      const createEventDto = {
        title: 'Test Event E2E',
        description: 'Description de test pour E2E',
        date: '2026-12-31T14:00:00',
        location: 'Salle de test',
        capacity: 50,
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createEventDto)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(createEventDto.title);
      expect(response.body.status).toBe('DRAFT');
      createdEventId = response.body._id;
    });

    it('devrait refuser la création si non authentifié', async () => {
      const createEventDto = {
        title: 'Test Event',
        description: 'Description',
        date: '2026-12-31T14:00:00',
        location: 'Salle',
        capacity: 50,
      };

      await request(app.getHttpServer())
        .post('/events')
        .send(createEventDto)
        .expect(401);
    });

    it('devrait refuser la création si participant (non admin)', async () => {
      const createEventDto = {
        title: 'Test Event',
        description: 'Description',
        date: '2026-12-31T14:00:00',
        location: 'Salle',
        capacity: 50,
      };

      await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${participantToken}`)
        .send(createEventDto)
        .expect(403);
    });

    it('devrait valider les champs requis', async () => {
      const invalidEventDto = {
        title: 'Test',
      };

      await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidEventDto)
        .expect(400);
    });
  });

  describe('GET /events', () => {
    it('devrait retourner uniquement les événements publiés (public)', async () => {
      const response = await request(app.getHttpServer())
        .get('/events')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((event: any) => {
        expect(event.status).toBe('PUBLISHED');
      });
    });

    it('devrait retourner tous les événements pour admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/events/admin/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /events/:id', () => {
    it('devrait retourner un événement publié par ID (public)', async () => {
      if (!createdEventId) {
        const createResponse = await request(app.getHttpServer())
          .post('/events')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Test Event',
            description: 'Description',
            date: '2026-12-31T14:00:00',
            location: 'Salle',
            capacity: 50,
          });
        createdEventId = createResponse.body._id;
      }

      await request(app.getHttpServer())
        .patch(`/events/${createdEventId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(`/events/${createdEventId}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id', createdEventId);
      expect(response.body.status).toBe('PUBLISHED');
    });

    it('devrait retourner 404 pour un événement DRAFT (non visible publiquement)', async () => {
      const draftResponse = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Event Brouillon',
          description: 'Description',
          date: '2026-12-31T14:00:00',
          location: 'Salle',
          capacity: 50,
        })
        .expect(201);
      const draftId = draftResponse.body._id;

      await request(app.getHttpServer())
        .get(`/events/${draftId}`)
        .expect(404);
    });

    it("devrait permettre à l'admin de récupérer un événement DRAFT via /events/admin/:id", async () => {
      const draftResponse = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Event Brouillon Admin',
          description: 'Description',
          date: '2026-12-31T14:00:00',
          location: 'Salle',
          capacity: 50,
        })
        .expect(201);
      const draftId = draftResponse.body._id;

      const response = await request(app.getHttpServer())
        .get(`/events/admin/${draftId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id', draftId);
      expect(response.body.status).toBe('DRAFT');
    });

    it("devrait retourner 404 si l'événement n'existe pas", async () => {
      await request(app.getHttpServer())
        .get('/events/507f1f77bcf86cd799439011')
        .expect(404);
    });
  });

  describe('PATCH /events/:id (Admin seulement)', () => {
    it('devrait mettre à jour un événement', async () => {
      if (!createdEventId) {
        const createResponse = await request(app.getHttpServer())
          .post('/events')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Test Event',
            description: 'Description',
            date: '2026-12-31T14:00:00',
            location: 'Salle',
            capacity: 50,
          });
        createdEventId = createResponse.body._id;
      }

      const updateDto = {
        title: 'Event Mis à Jour',
        capacity: 100,
      };

      const response = await request(app.getHttpServer())
        .patch(`/events/${createdEventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.title).toBe(updateDto.title);
      expect(response.body.capacity).toBe(updateDto.capacity);
    });
  });

  describe('PATCH /events/:id/publish (Admin seulement)', () => {
    it('devrait publier un événement', async () => {
      if (!createdEventId) {
        const createResponse = await request(app.getHttpServer())
          .post('/events')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Test Event',
            description: 'Description',
            date: '2026-12-31T14:00:00',
            location: 'Salle',
            capacity: 50,
          });
        createdEventId = createResponse.body._id;
      }

      const response = await request(app.getHttpServer())
        .patch(`/events/${createdEventId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('PUBLISHED');
    });
  });

  describe('PATCH /events/:id/cancel (Admin seulement)', () => {
    it('devrait annuler un événement', async () => {
      let eventId = createdEventId;
      if (!eventId) {
        const createResponse = await request(app.getHttpServer())
          .post('/events')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Test Event Cancel',
            description: 'Description',
            date: '2026-12-31T14:00:00',
            location: 'Salle',
            capacity: 50,
          });
        eventId = createResponse.body._id;
      }

      const response = await request(app.getHttpServer())
        .patch(`/events/${eventId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('CANCELED');
    });
  });

  describe('Scénario complet: CRUD événement', () => {
    it('devrait permettre de créer, lire, mettre à jour, publier et annuler un événement', async () => {
      const createDto = {
        title: 'Event CRUD Test',
        description: 'Test complet CRUD',
        date: '2026-12-31T14:00:00',
        location: 'Salle CRUD',
        capacity: 30,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createDto)
        .expect(201);

      const eventId = createResponse.body._id;

      const getResponse = await request(app.getHttpServer())
        .get(`/events/admin/${eventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(getResponse.body.title).toBe(createDto.title);

      const updateResponse = await request(app.getHttpServer())
        .patch(`/events/${eventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Event Mis à Jour' })
        .expect(200);

      expect(updateResponse.body.title).toBe('Event Mis à Jour');

      const publishResponse = await request(app.getHttpServer())
        .patch(`/events/${eventId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(publishResponse.body.status).toBe('PUBLISHED');

      const getPublishedResponse = await request(app.getHttpServer())
        .get(`/events/${eventId}`)
        .expect(200);
      expect(getPublishedResponse.body.status).toBe('PUBLISHED');

      const cancelResponse = await request(app.getHttpServer())
        .patch(`/events/${eventId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(cancelResponse.body.status).toBe('CANCELED');
    });
  });
});
