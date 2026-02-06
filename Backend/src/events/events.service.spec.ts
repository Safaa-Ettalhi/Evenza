import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EventsService } from './events.service';
import { Event, EventStatus } from './event.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CustomNotFoundException } from '../common/exceptions/not-found.exception';
import { Reservation } from '../reservations/reservation.schema';

describe('EventsService', () => {
  let service: EventsService;
  let eventModel: any;
  let mockInstance: any;

  const mockEventModel: any = jest.fn(function (data: any) {
    mockInstance = {
      _id: 'event_id',
      capacity: data?.capacity ?? 50,
      toObject: jest.fn().mockImplementation(function (this: any) {
        return { _id: this._id, capacity: this.capacity, ...data };
      }),
      ...data,
      save: jest.fn().mockImplementation(function () {
        return Promise.resolve(this);
      }),
    };
    return mockInstance;
  });

  mockEventModel.find = jest.fn().mockReturnThis();
  mockEventModel.findById = jest.fn().mockReturnThis();
  mockEventModel.findByIdAndUpdate = jest.fn().mockReturnThis();
  mockEventModel.sort = jest.fn().mockReturnThis();
  mockEventModel.exec = jest.fn();

  const mockReservationModel = {
    countDocuments: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(0),
  };

  beforeEach(async () => {
    mockReservationModel.exec.mockResolvedValue(0);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getModelToken(Event.name),
          useValue: mockEventModel,
        },
        {
          provide: getModelToken(Reservation.name),
          useValue: mockReservationModel,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    eventModel = module.get(getModelToken(Event.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('devrait créer un événement avec statut DRAFT par défaut', async () => {
      const createEventDto: CreateEventDto = {
        title: 'Test Event',
        description: 'Test Description',
        date: '2026-12-31T12:00:00',
        location: 'Test Location',
        capacity: 50,
      };

      const result = await service.create(createEventDto);

      expect(eventModel).toHaveBeenCalled();
      expect(mockInstance.save).toHaveBeenCalled();
      expect(result.status).toBe(EventStatus.DRAFT);
    });

    it('devrait créer un événement avec le statut spécifié', async () => {
      const createEventDto: CreateEventDto = {
        title: 'Test Event',
        description: 'Test Description',
        date: '2026-12-31T12:00:00',
        location: 'Test Location',
        capacity: 50,
        status: EventStatus.PUBLISHED,
      };

      const result = await service.create(createEventDto);

      expect(eventModel).toHaveBeenCalled();
      expect(mockInstance.save).toHaveBeenCalled();
      expect(result.status).toBe(EventStatus.PUBLISHED);
    });
  });

  describe('findAll', () => {
    it('devrait retourner tous les événements triés par date avec availableSpots', async () => {
      const events = [
        { _id: '1', title: 'Event 1', date: new Date('2026-01-01'), capacity: 50 },
        { _id: '2', title: 'Event 2', date: new Date('2026-01-02'), capacity: 30 },
      ];

      mockEventModel.exec.mockResolvedValue(events);

      const result = await service.findAll();

      expect(mockEventModel.find).toHaveBeenCalledWith({});
      expect(mockEventModel.sort).toHaveBeenCalledWith({ date: 1 });
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ _id: '1', title: 'Event 1' });
      expect(result[0].availableSpots).toBe(50);
      expect(result[1].availableSpots).toBe(30);
    });

    it('devrait filtrer par statut si fourni', async () => {
      const events = [
        { _id: '1', title: 'Event 1', status: EventStatus.PUBLISHED, capacity: 50 },
      ];

      mockEventModel.exec.mockResolvedValue(events);

      const result = await service.findAll(EventStatus.PUBLISHED);

      expect(mockEventModel.find).toHaveBeenCalledWith({
        status: EventStatus.PUBLISHED,
      });
      expect(result[0]).toMatchObject({ _id: '1', title: 'Event 1' });
      expect(result[0].availableSpots).toBe(50);
    });
  });

  describe('findPublished', () => {
    it('devrait retourner uniquement les événements publiés avec availableSpots', async () => {
      const events = [
        { _id: '1', title: 'Event 1', status: EventStatus.PUBLISHED, capacity: 50 },
      ];

      mockEventModel.exec.mockResolvedValue(events);

      const result = await service.findPublished();

      expect(mockEventModel.find).toHaveBeenCalledWith({
        status: EventStatus.PUBLISHED,
      });
      expect(mockEventModel.sort).toHaveBeenCalledWith({ date: 1 });
      expect(result[0]).toMatchObject({ _id: '1', title: 'Event 1' });
      expect(result[0].availableSpots).toBe(50);
    });
  });

  describe('findOne', () => {
    it('devrait retourner un événement par ID avec availableSpots', async () => {
      const event = { _id: 'event_id', title: 'Test Event', capacity: 50 };

      mockEventModel.exec.mockResolvedValue(event);

      const result = await service.findOne('event_id');

      expect(mockEventModel.findById).toHaveBeenCalledWith('event_id');
      expect(result).toMatchObject({ _id: 'event_id', title: 'Test Event' });
      expect(result.availableSpots).toBe(50);
    });

    it("devrait lancer une exception si l'événement n'existe pas", async () => {
      mockEventModel.exec.mockResolvedValue(null);

      await expect(service.findOne('nonexistent_id')).rejects.toThrow(
        CustomNotFoundException,
      );
    });
  });

  describe('update', () => {
    it('devrait mettre à jour un événement', async () => {
      const updateDto: UpdateEventDto = {
        title: 'Updated Title',
      };

      const updatedEvent = {
        _id: 'event_id',
        title: 'Updated Title',
        description: 'Test Description',
        capacity: 50,
        toObject: jest.fn().mockReturnValue({
          _id: 'event_id',
          title: 'Updated Title',
          description: 'Test Description',
          capacity: 50,
        }),
      };

      mockEventModel.exec.mockResolvedValue(updatedEvent);

      const result = await service.update('event_id', updateDto);

      expect(mockEventModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'event_id',
        expect.objectContaining({ title: 'Updated Title' }),
        { new: true },
      );
      expect(result).toMatchObject({ title: 'Updated Title' });
      expect(result.availableSpots).toBe(50);
    });

    it('devrait convertir la date en objet Date si fournie', async () => {
      const updateDto: UpdateEventDto = {
        date: '2026-12-31T12:00:00',
      };

      const updatedEvent = {
        _id: 'event_id',
        date: new Date(updateDto.date),
        capacity: 50,
        toObject: jest.fn().mockReturnValue({
          _id: 'event_id',
          date: new Date(updateDto.date),
          capacity: 50,
        }),
      };

      mockEventModel.exec.mockResolvedValue(updatedEvent);

      await service.update('event_id', updateDto);

      expect(mockEventModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'event_id',
        expect.objectContaining({ date: new Date(updateDto.date) }),
        { new: true },
      );
    });

    it("devrait lancer une exception si l'événement n'existe pas", async () => {
      const updateDto: UpdateEventDto = { title: 'Updated Title' };

      mockEventModel.exec.mockResolvedValue(null);

      await expect(service.update('nonexistent_id', updateDto)).rejects.toThrow(
        CustomNotFoundException,
      );
    });
  });

  describe('publish', () => {
    it('devrait publier un événement', async () => {
      const publishedEvent = {
        _id: 'event_id',
        title: 'Test Event',
        status: EventStatus.PUBLISHED,
        capacity: 50,
        toObject: jest.fn().mockReturnValue({
          _id: 'event_id',
          title: 'Test Event',
          status: EventStatus.PUBLISHED,
          capacity: 50,
        }),
      };

      mockEventModel.exec.mockResolvedValue(publishedEvent);

      const result = await service.publish('event_id');

      expect(mockEventModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'event_id',
        { status: EventStatus.PUBLISHED },
        { new: true },
      );
      expect(result.status).toBe(EventStatus.PUBLISHED);
      expect(result.availableSpots).toBe(50);
    });

    it("devrait lancer une exception si l'événement n'existe pas", async () => {
      mockEventModel.exec.mockResolvedValue(null);

      await expect(service.publish('nonexistent_id')).rejects.toThrow(
        CustomNotFoundException,
      );
    });
  });

  describe('cancel', () => {
    it('devrait annuler un événement', async () => {
      const canceledEvent = {
        _id: 'event_id',
        title: 'Test Event',
        status: EventStatus.CANCELED,
        capacity: 50,
        toObject: jest.fn().mockReturnValue({
          _id: 'event_id',
          title: 'Test Event',
          status: EventStatus.CANCELED,
          capacity: 50,
        }),
      };

      mockEventModel.exec.mockResolvedValue(canceledEvent);

      const result = await service.cancel('event_id');

      expect(mockEventModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'event_id',
        { status: EventStatus.CANCELED },
        { new: true },
      );
      expect(result.status).toBe(EventStatus.CANCELED);
      expect(result.availableSpots).toBe(50);
    });

    it("devrait lancer une exception si l'événement n'existe pas", async () => {
      mockEventModel.exec.mockResolvedValue(null);

      await expect(service.cancel('nonexistent_id')).rejects.toThrow(
        CustomNotFoundException,
      );
    });
  });
});
