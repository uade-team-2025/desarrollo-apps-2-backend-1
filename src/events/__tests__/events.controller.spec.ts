import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from '../events.controller';
import { EventsService } from '../events.service';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { PutEventDto } from '../dto/put-event.dto';

describe('EventsController', () => {
  let controller: EventsController;
  let service: EventsService;

  const mockEvent = {
    _id: '507f1f77bcf86cd799439011',
    culturalPlaceId: {
      _id: '507f1f77bcf86cd799439012',
      name: 'Centro Cultural Raices',
      description: 'Un centro cultural que ofrece servicios de biblioteca, proyecciones de cine y galería de arte',
      category: 'Centro Cultural',
      characteristics: ['Servicios de Biblioteca', 'Proyecciones de Cine', 'Galería de Arte'],
      contact: {
        address: 'Agrelo 3045',
        coordinates: { lat: -34.61724004, lng: -58.40879856 },
        phone: '49316157',
        website: 'https://example.com',
        email: 'info@lugar.com'
      },
      image: 'https://picsum.photos/800/600?random=756',
      rating: 3.3
    },
    name: 'Exposición de Arte Contemporáneo',
    description: 'Una muestra de artistas locales',
    date: new Date('2025-12-25'),
    time: '19:00',
    image: 'https://example.com/event-image.jpg',
    ticketTypes: [
      {
        type: 'general',
        price: 1000,
        initialQuantity: 100,
        soldQuantity: 0,
        isActive: true,
      },
      {
        type: 'vip',
        price: 2000,
        initialQuantity: 20,
        soldQuantity: 0,
        isActive: true,
      },
    ],
    isActive: true,
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByCulturalPlace: jest.fn(),
    findByDateRange: jest.fn(),
    findActiveEvents: jest.fn(),
    update: jest.fn(),
    toggleActive: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an event', async () => {
      const createEventDto: CreateEventDto = {
        culturalPlaceId: '507f1f77bcf86cd799439012',
        name: 'Exposición de Arte Contemporáneo',
        description: 'Una muestra de artistas locales',
        date: '2025-12-25',
        time: '19:00',
        image: 'https://example.com/event-image.jpg',
        ticketTypes: [
          {
            type: 'general',
            price: 1000,
            initialQuantity: 100,
            isActive: true,
          },
        ],
        isActive: true,
      };

      mockService.create.mockResolvedValue(mockEvent);

      const result = await controller.create(createEventDto);

      expect(result).toEqual(mockEvent);
      expect(service.create).toHaveBeenCalledWith(createEventDto);
    });
  });

  describe('findAll', () => {
    it('should return all events', async () => {
      mockService.findAll.mockResolvedValue([mockEvent]);

      const result = await controller.findAll();

      expect(result).toEqual([mockEvent]);
      expect(service.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should return filtered events', async () => {
      const query = { isActive: true };
      mockService.findAll.mockResolvedValue([mockEvent]);

      const result = await controller.findAll(query);

      expect(result).toEqual([mockEvent]);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return an event by id', async () => {
      mockService.findOne.mockResolvedValue(mockEvent);

      const result = await controller.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockEvent);
      expect(service.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('findByCulturalPlace', () => {
    it('should return events by cultural place', async () => {
      mockService.findByCulturalPlace.mockResolvedValue([mockEvent]);

      const result = await controller.findByCulturalPlace('507f1f77bcf86cd799439012');

      expect(result).toEqual([mockEvent]);
      expect(service.findByCulturalPlace).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
    });
  });

  describe('findByDateRange', () => {
    it('should return events by date range', async () => {
      mockService.findByDateRange.mockResolvedValue([mockEvent]);

      const result = await controller.findByDateRange('2025-01-01', '2025-12-31');

      expect(result).toEqual([mockEvent]);
      expect(service.findByDateRange).toHaveBeenCalledWith(new Date('2025-01-01'), new Date('2025-12-31'));
    });
  });

  describe('findActiveEvents', () => {
    it('should return active events', async () => {
      mockService.findActiveEvents.mockResolvedValue([mockEvent]);

      const result = await controller.findActiveEvents();

      expect(result).toEqual([mockEvent]);
      expect(service.findActiveEvents).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an event completely', async () => {
      const putEventDto: PutEventDto = {
        name: 'Taller de Pinturas',
        description: 'Taller de técnicas de pintura moderna',
        date: '2025-11-20',
        time: '14:00',
        isActive: true,
        ticketTypes: [
          {
            type: 'general',
            price: 800,
            initialQuantity: 25,
            soldQuantity: 1
          }
        ]
      };
      const updatedEvent = { ...mockEvent, ...putEventDto };

      mockService.update.mockResolvedValue(updatedEvent);

      const result = await controller.update('507f1f77bcf86cd799439011', putEventDto);

      expect(result).toEqual(updatedEvent);
      expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', putEventDto);
    });
  });

  describe('toggleActive', () => {
    it('should toggle active status', async () => {
      const inactiveEvent = { ...mockEvent, isActive: false, status: 'INACTIVE' };
      mockService.toggleActive.mockResolvedValue(inactiveEvent);

      const result = await controller.toggleActive('507f1f77bcf86cd799439011');

      expect(result).toEqual(inactiveEvent);
      expect(service.toggleActive).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('remove', () => {
    it('should remove an event', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove('507f1f77bcf86cd799439011');

      expect(service.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });
});
