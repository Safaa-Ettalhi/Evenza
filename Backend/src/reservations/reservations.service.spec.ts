import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { EventsService } from '../events/events.service';
import {
  Reservation,
  ReservationDocument,
  ReservationStatus,
} from './reservation.schema';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { EventStatus } from '../events/event.schema';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let reservationModel: any;
  let eventsService: jest.Mocked<EventsService>;
  let mockQueryChain: any;

  const mockReservationModel: any = jest.fn(function (data: any) {
    return {
      ...data,
      save: jest.fn().mockResolvedValue(data),
      toString: jest
        .fn()
        .mockReturnValue(data._id || data.eventId || data.userId),
    };
  });

  beforeEach(async () => {
    mockQueryChain = {
      exec: jest.fn(),
      populate: jest.fn().mockReturnThis(),
    };

    mockReservationModel.find = jest.fn().mockReturnValue(mockQueryChain);
    mockReservationModel.findById = jest.fn().mockReturnValue(mockQueryChain);
    mockReservationModel.findOne = jest.fn().mockReturnValue(mockQueryChain);
    mockReservationModel.countDocuments = jest
      .fn()
      .mockReturnValue(mockQueryChain);
    const mockEventsService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: getModelToken(Reservation.name),
          useValue: mockReservationModel,
        },
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
    reservationModel = module.get(getModelToken(Reservation.name));
    eventsService = module.get(EventsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('devrait créer une réservation pour un événement publié avec capacité disponible', async () => {
      const createReservationDto: CreateReservationDto = {
        eventId: '507f1f77bcf86cd799439011',
      };
      const userId = '507f1f77bcf86cd799439012';

      const event = {
        _id: createReservationDto.eventId,
        title: 'Test Event',
        status: EventStatus.PUBLISHED,
        capacity: 50,
      };

      const savedReservation = {
        _id: 'reservation_id',
        eventId: createReservationDto.eventId,
        userId,
        status: ReservationStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      eventsService.findOne.mockResolvedValue(event as any);
      mockQueryChain.exec.mockResolvedValueOnce(10).mockResolvedValueOnce(null);

      const mockInstance = {
        ...savedReservation,
        save: jest.fn().mockResolvedValue(savedReservation),
      };
      jest
        .spyOn(reservationModel, 'constructor' as any)
        .mockImplementation(() => mockInstance);

      const result = await service.create(createReservationDto, userId);

      expect(eventsService.findOne).toHaveBeenCalledWith(
        createReservationDto.eventId,
      );
      expect(mockReservationModel.findOne).toHaveBeenCalled();
      expect(result.status).toBe(ReservationStatus.PENDING);
    });

    it("devrait lancer une exception si l'événement n'est pas publié", async () => {
      const createReservationDto: CreateReservationDto = {
        eventId: '507f1f77bcf86cd799439011',
      };
      const userId = '507f1f77bcf86cd799439012';

      const event = {
        _id: createReservationDto.eventId,
        status: EventStatus.DRAFT,
      };

      eventsService.findOne.mockResolvedValue(event as any);

      await expect(
        service.create(createReservationDto, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it("devrait lancer une exception si l'événement est complet", async () => {
      const createReservationDto: CreateReservationDto = {
        eventId: '507f1f77bcf86cd799439011',
      };
      const userId = '507f1f77bcf86cd799439012';

      const event = {
        _id: createReservationDto.eventId,
        status: EventStatus.PUBLISHED,
        capacity: 10,
      };

      eventsService.findOne.mockResolvedValue(event as any);
      mockQueryChain.exec.mockResolvedValue(10);

      await expect(
        service.create(createReservationDto, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('devrait lancer une exception si une réservation existe déjà', async () => {
      const createReservationDto: CreateReservationDto = {
        eventId: '507f1f77bcf86cd799439011',
      };
      const userId = '507f1f77bcf86cd799439012';

      const event = {
        _id: createReservationDto.eventId,
        status: EventStatus.PUBLISHED,
        capacity: 50,
      };

      const existingReservation = {
        _id: 'existing_reservation',
        eventId: createReservationDto.eventId,
        userId,
        status: ReservationStatus.PENDING,
      };

      eventsService.findOne.mockResolvedValue(event as any);
      mockQueryChain.exec
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(existingReservation);

      await expect(
        service.create(createReservationDto, userId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirm', () => {
    it('devrait confirmer une réservation en attente', async () => {
      const reservationId = 'reservation_id';
      const eventId = '507f1f77bcf86cd799439011';

      const eventIdObj = {
        toString: jest.fn().mockReturnValue(eventId),
      };

      const reservation = {
        _id: reservationId,
        eventId: eventIdObj,
        userId: 'user_id',
        status: ReservationStatus.PENDING,
        save: jest.fn().mockImplementation(function () {
          this.status = ReservationStatus.CONFIRMED;
          return Promise.resolve(this);
        }),
        toString: jest.fn().mockReturnValue(eventId),
      };

      const event = {
        _id: eventId,
        capacity: 50,
      };

      mockQueryChain.exec
        .mockResolvedValueOnce(reservation)
        .mockResolvedValueOnce(10);
      eventsService.findOne.mockResolvedValue(event as any);

      const result = await service.confirm(reservationId);

      expect(reservation.status).toBe(ReservationStatus.CONFIRMED);
      expect(reservation.save).toHaveBeenCalled();
    });

    it('devrait lancer une exception si la capacité est atteinte', async () => {
      const reservationId = 'reservation_id';
      const eventId = '507f1f77bcf86cd799439011';

      const reservation = {
        _id: reservationId,
        eventId: {
          toString: jest.fn().mockReturnValue(eventId),
        },
        status: ReservationStatus.PENDING,
        toString: jest.fn().mockReturnValue(eventId),
      };

      const event = {
        _id: eventId,
        capacity: 10,
      };

      mockQueryChain.exec
        .mockResolvedValueOnce(reservation)
        .mockResolvedValueOnce(10);
      eventsService.findOne.mockResolvedValue(event as any);

      await expect(service.confirm(reservationId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('refuse', () => {
    it('devrait refuser une réservation en attente', async () => {
      const reservationId = 'reservation_id';

      const reservation = {
        _id: reservationId,
        status: ReservationStatus.PENDING,
        save: jest.fn().mockImplementation(function () {
          this.status = ReservationStatus.REFUSED;
          return Promise.resolve(this);
        }),
      };

      mockQueryChain.exec.mockResolvedValue(reservation);

      const result = await service.refuse(reservationId);

      expect(reservation.status).toBe(ReservationStatus.REFUSED);
      expect(reservation.save).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('devrait annuler une réservation', async () => {
      const reservationId = 'reservation_id';

      const reservation = {
        _id: reservationId,
        userId: 'user_id',
        status: ReservationStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
        toString: jest.fn().mockReturnValue('user_id'),
      };

      mockQueryChain.exec.mockResolvedValue(reservation);

      const result = await service.cancel(reservationId);

      expect(reservation.status).toBe(ReservationStatus.CANCELED);
      expect(reservation.save).toHaveBeenCalled();
    });

    it("devrait vérifier que l'utilisateur peut annuler sa propre réservation", async () => {
      const reservationId = 'reservation_id';
      const userId = 'user_id';

      const reservation = {
        _id: reservationId,
        userId,
        status: ReservationStatus.PENDING,
        save: jest.fn().mockImplementation(function () {
          this.status = ReservationStatus.CANCELED;
          return Promise.resolve(this);
        }),
        toString: jest.fn().mockReturnValue(userId),
      };

      mockQueryChain.exec.mockResolvedValue(reservation);

      await expect(
        service.cancel(reservationId, userId),
      ).resolves.toBeDefined();
    });

    it("devrait lancer une exception si l'utilisateur essaie d'annuler une autre réservation", async () => {
      const reservationId = 'reservation_id';
      const userId = 'user_id';
      const otherUserId = 'other_user_id';

      const reservation = {
        _id: reservationId,
        userId: otherUserId,
        status: ReservationStatus.PENDING,
        toString: jest.fn().mockReturnValue(otherUserId),
      };

      mockQueryChain.exec.mockResolvedValue(reservation);

      await expect(service.cancel(reservationId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
