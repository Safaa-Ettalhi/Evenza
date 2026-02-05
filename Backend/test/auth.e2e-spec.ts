import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import * as mongoose from 'mongoose';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let participantToken: string;
  let adminId: string;
  let participantId: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('devrait créer un nouveau compte participant', async () => {
      const registerDto = {
        email: `test-participant-${Date.now()}@example.com`,
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Inscription réussie');
      expect(response.body).toHaveProperty('userId');
      participantId = response.body.userId;
    });

    it("devrait lancer une erreur si l'email existe déjà", async () => {
      const email = `test-duplicate-${Date.now()}@example.com`;
      const registerDto = {
        email,
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);
    });

    it("devrait lancer une erreur si l'email est invalide", async () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('devrait lancer une erreur si le mot de passe est trop court', async () => {
      const registerDto = {
        email: 'test2@example.com',
        password: '12345',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('devrait retourner un token JWT pour des identifiants valides', async () => {
      const email = `test-login-${Date.now()}@example.com`;
      const password = 'password123';

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password })
        .expect(201);

      const loginDto = {
        email,
        password,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto);

      expect([200, 201]).toContain(response.status);
      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');
      participantToken = response.body.access_token;
    });

    it("devrait lancer une erreur si l'email n'existe pas", async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('devrait lancer une erreur si le mot de passe est incorrect', async () => {
      const email = `test-wrong-password-${Date.now()}@example.com`;
      const password = 'password123';

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password })
        .expect(201);

      const loginDto = {
        email,
        password: 'wrongpassword',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it("devrait lancer une erreur si l'email est invalide", async () => {
      const loginDto = {
        email: 'invalid-email',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(400);
    });
  });

  describe('Scénario complet: Inscription → Login → Utilisation du token', () => {
    it("devrait permettre l'inscription, la connexion et l'utilisation du token", async () => {
      const email = `test-${Date.now()}@example.com`;
      const password = 'password123';

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password })
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password });

      expect([200, 201]).toContain(loginResponse.status);
      const token = loginResponse.body.access_token;

      const reservationsResponse = await request(app.getHttpServer())
        .get('/reservations/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(reservationsResponse.body)).toBe(true);
    });
  });
});
