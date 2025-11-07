import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventsService } from '../events.service';
import type { EventRepository } from '../interfaces/event.repository.interface';
import { EVENT_REPOSITORY } from '../interfaces/event.repository.token';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { PutEventDto } from '../dto/put-event.dto';
import { EventNotificationService } from '../../notifications/event-notification.service';

// Import the new services
import { EventValidator } from '../validators/event.validator';
import { TicketValidator } from '../validators/ticket.validator';
import { EventDataTransformer } from '../transformers/event-data.transformer';
import { EventChangeDetector } from '../change-detection/event-change-detector.service';
import { ChangeValueFormatter } from '../change-detection/change-value-formatter.service';
import { EventChangeNotifier } from '../change-detection/event-change-notifier.service';

describe('EventsService', () => {
  let service: EventsService;
  let repository: jest.Mocked<EventRepository>;
  let eventNotificationService: jest.Mocked<EventNotificationService>;
  let module: TestingModule;

  const mockEvent: any = {
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

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCulturalPlace: jest.fn(),
    findByDateRange: jest.fn(),
    findActiveEvents: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    toggleActive: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    module = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: EVENT_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: EventNotificationService,
          useValue: {
            publishEventChange: jest.fn(),
          },
        },
        // Validators
        {
          provide: EventValidator,
          useValue: {
            validateEventData: jest.fn(),
            validateEventTime: jest.fn(),
          },
        },
        {
          provide: TicketValidator,
          useValue: {
            validateTicketTypes: jest.fn(),
            validateTicketTypesPut: jest.fn(),
          },
        },
        // Transformers
        {
          provide: EventDataTransformer,
          useValue: {
            transformCreateEventData: jest.fn().mockImplementation((data) => ({
              ...data,
              culturalPlaceId: expect.any(Object),
              date: new Date(data.date),
              isActive: data.isActive ?? true,
              status: data.status ?? (data.isActive === false ? 'INACTIVE' : 'ACTIVE'),
              ticketTypes: data.ticketTypes.map(ticketType => ({
                ...ticketType,
                soldQuantity: 0,
                isActive: ticketType.isActive ?? true
              }))
            })),
            transformEventCoordinates: jest.fn().mockImplementation((event) => event),
            transformEventsCoordinates: jest.fn().mockImplementation((events) => events),
          },
        },
        // Change Detection
        {
          provide: EventChangeDetector,
          useValue: {
            detectCriticalChange: jest.fn(),
            detectStatusChange: jest.fn(),
          },
        },
        {
          provide: ChangeValueFormatter,
          useValue: {
            getChangeValues: jest.fn(),
          },
        },
        {
          provide: EventChangeNotifier,
          useValue: {
            notifyEventChange: jest.fn(),
            notifyStatusChange: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    repository = module.get(EVENT_REPOSITORY);
    eventNotificationService = module.get(EventNotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
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

    it('should create an event successfully', async () => {
      repository.create.mockResolvedValue(mockEvent);

      const result = await service.create(createEventDto);

      expect(result).toEqual(mockEvent);
      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
        ...createEventDto,
        culturalPlaceId: expect.any(Object),
        date: new Date(createEventDto.date),
        isActive: true,
        status: 'ACTIVE',
        ticketTypes: [
          {
            ...createEventDto.ticketTypes[0],
            soldQuantity: 0,
            isActive: true,
          },
        ],
      }));
    });


    it('should create event with custom ticket type successfully', async () => {
      const customTicketDto = {
        ...createEventDto,
        ticketTypes: [
          {
            type: 'premium',
            price: 5000,
            initialQuantity: 50,
            isActive: true,
          },
        ],
      };

      const mockEventWithCustomTicket = {
        ...mockEvent,
        ticketTypes: [
          {
            type: 'premium',
            price: 5000,
            initialQuantity: 50,
            soldQuantity: 0,
            isActive: true,
          },
        ],
      };

      repository.create.mockResolvedValue(mockEventWithCustomTicket);

      const result = await service.create(customTicketDto);

      expect(result).toEqual(mockEventWithCustomTicket);
      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
        ...customTicketDto,
        culturalPlaceId: expect.any(Object),
        date: new Date(customTicketDto.date),
        isActive: true,
        status: 'ACTIVE',
        ticketTypes: [
          {
            ...customTicketDto.ticketTypes[0],
            soldQuantity: 0,
            isActive: true,
          },
        ],
      }));
    });

    it('should create event with multiple custom ticket types successfully', async () => {
      const multipleCustomTicketsDto = {
        ...createEventDto,
        ticketTypes: [
          {
            type: 'estudiante',
            price: 2000,
            initialQuantity: 100,
            isActive: true,
          },
          {
            type: 'senior',
            price: 3000,
            initialQuantity: 30,
            isActive: true,
          },
          {
            type: 'grupo_familiar',
            price: 8000,
            initialQuantity: 20,
            isActive: true,
          },
        ],
      };

      const mockEventWithMultipleCustomTickets = {
        ...mockEvent,
        ticketTypes: [
          {
            type: 'estudiante',
            price: 2000,
            initialQuantity: 100,
            soldQuantity: 0,
            isActive: true,
          },
          {
            type: 'senior',
            price: 3000,
            initialQuantity: 30,
            soldQuantity: 0,
            isActive: true,
          },
          {
            type: 'grupo_familiar',
            price: 8000,
            initialQuantity: 20,
            soldQuantity: 0,
            isActive: true,
          },
        ],
      };

      repository.create.mockResolvedValue(mockEventWithMultipleCustomTickets);

      const result = await service.create(multipleCustomTicketsDto);

      expect(result).toEqual(mockEventWithMultipleCustomTickets);
      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
        ...multipleCustomTicketsDto,
        culturalPlaceId: expect.any(Object),
        date: new Date(multipleCustomTicketsDto.date),
        isActive: true,
        status: 'ACTIVE',
        ticketTypes: multipleCustomTicketsDto.ticketTypes.map(ticket => ({
          ...ticket,
          soldQuantity: 0,
          isActive: true,
        })),
      }));
    });

    it('should throw BadRequestException for duplicate ticket types', async () => {
      const duplicateTicketDto = {
        ...createEventDto,
        ticketTypes: [
          { type: 'general', price: 1000, initialQuantity: 100 },
          { type: 'general', price: 1500, initialQuantity: 50 },
        ],
      };

      // Mock the ticket validator to throw an exception
      const ticketValidator = module.get(TicketValidator);
      ticketValidator.validateTicketTypes = jest.fn().mockImplementation(() => {
        throw new BadRequestException('Duplicate ticket type: general');
      });

      await expect(service.create(duplicateTicketDto)).rejects.toThrow(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid time format', async () => {
      const invalidTimeDto = {
        ...createEventDto,
        time: '25:00',
      };

      // Mock the event validator to throw an exception
      const eventValidator = module.get(EventValidator);
      eventValidator.validateEventData = jest.fn().mockImplementation(() => {
        throw new BadRequestException('Invalid time format. Use HH:MM format');
      });

      await expect(service.create(invalidTimeDto)).rejects.toThrow(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all events', async () => {
      const events = [mockEvent];
      repository.findAll.mockResolvedValue(events);

      const result = await service.findAll();

      expect(result).toEqual(events);
      expect(repository.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should return filtered events', async () => {
      const events = [mockEvent];
      const query = { isActive: true };
      repository.findAll.mockResolvedValue(events);

      const result = await service.findAll(query);

      expect(result).toEqual(events);
      expect(repository.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return an event by id', async () => {
      repository.findById.mockResolvedValue(mockEvent);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockEvent);
      expect(repository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException if event not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
      expect(repository.findById).toHaveBeenCalledWith('invalid-id');
    });
  });

  describe('findByCulturalPlace', () => {
    it('should return events for a cultural place', async () => {
      const events = [mockEvent];
      repository.findByCulturalPlace.mockResolvedValue(events);

      const result = await service.findByCulturalPlace('507f1f77bcf86cd799439012');

      expect(result).toEqual(events);
      expect(repository.findByCulturalPlace).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
    });
  });

  describe('findByDateRange', () => {
    it('should return events within date range', async () => {
      const events = [mockEvent];
      const startDate = new Date('2024-12-01');
      const endDate = new Date('2024-12-31');
      repository.findByDateRange.mockResolvedValue(events);

      const result = await service.findByDateRange(startDate, endDate);

      expect(result).toEqual(events);
      expect(repository.findByDateRange).toHaveBeenCalledWith(startDate, endDate);
    });
  });

  describe('findActiveEvents', () => {
    it('should return active events', async () => {
      const events = [mockEvent];
      repository.findActiveEvents.mockResolvedValue(events);

      const result = await service.findActiveEvents();

      expect(result).toEqual(events);
      expect(repository.findActiveEvents).toHaveBeenCalled();
    });
  });

  describe('update', () => {
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

    it('should update an event successfully', async () => {
      const updatedEvent = { ...mockEvent, ...putEventDto };
      repository.findById.mockResolvedValue(mockEvent);
      repository.update.mockResolvedValue(updatedEvent);

      const result = await service.update('507f1f77bcf86cd799439011', putEventDto);

      expect(result).toEqual(updatedEvent);
      expect(repository.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', expect.objectContaining({
        name: putEventDto.name,
        description: putEventDto.description,
        date: expect.any(Date),
        time: putEventDto.time,
        isActive: putEventDto.isActive,
        ticketTypes: putEventDto.ticketTypes
        // NO debe incluir culturalPlaceId ni image para preservarlos del evento original
      }));
    });

    it('should throw NotFoundException if event not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('invalid-id', putEventDto)).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should allow past date updates', async () => {
      const pastDateDto = { ...putEventDto, date: '2020-01-01' };
      repository.findById.mockResolvedValue(mockEvent);
      repository.update.mockResolvedValue(mockEvent);

      const result = await service.update('507f1f77bcf86cd799439011', pastDateDto);

      expect(result).toEqual(mockEvent);
      expect(repository.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', expect.objectContaining({
        date: new Date('2020-01-01')
      }));
    });

    it('should validate ticket types with PUT validations', async () => {
      const invalidTicketDto = {
        ...putEventDto,
        ticketTypes: [
          { type: 'general', price: 1000, initialQuantity: 10, soldQuantity: 15 }, // soldQuantity > initialQuantity
        ],
      };
      repository.findById.mockResolvedValue(mockEvent);

      // Mock the ticket validator to throw an exception
      const ticketValidator = module.get(TicketValidator);
      ticketValidator.validateTicketTypesPut = jest.fn().mockImplementation(() => {
        throw new BadRequestException('Sold quantity cannot exceed initial quantity');
      });

      await expect(service.update('507f1f77bcf86cd799439011', invalidTicketDto)).rejects.toThrow(BadRequestException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should validate duplicate ticket types', async () => {
      const duplicateTicketDto = {
        ...putEventDto,
        ticketTypes: [
          { type: 'general', price: 1000, initialQuantity: 10, soldQuantity: 5 },
          { type: 'general', price: 1500, initialQuantity: 20, soldQuantity: 10 }, // Duplicate type
        ],
      };
      repository.findById.mockResolvedValue(mockEvent);

      // Mock the ticket validator to throw an exception
      const ticketValidator = module.get(TicketValidator);
      ticketValidator.validateTicketTypesPut = jest.fn().mockImplementation(() => {
        throw new BadRequestException('Duplicate ticket type: general');
      });

      await expect(service.update('507f1f77bcf86cd799439011', duplicateTicketDto)).rejects.toThrow(BadRequestException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should NOT include culturalPlaceId in update data to preserve original', async () => {
      const updatedEvent = { ...mockEvent, ...putEventDto };
      repository.findById.mockResolvedValue(mockEvent);
      repository.update.mockResolvedValue(updatedEvent);

      await service.update('507f1f77bcf86cd799439011', putEventDto);

      expect(repository.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', expect.not.objectContaining({
        culturalPlaceId: expect.anything()
      }));
    });

    it('should handle error when publishing event change notification', async () => {
      const originalEvent = {
        ...mockEvent,
        culturalPlaceId: { _id: '507f1f77bcf86cd799439012', name: 'Old Place' }
      };
      const updatedEvent = {
        ...mockEvent,
        culturalPlaceId: { _id: '507f1f77bcf86cd799439013', name: 'New Place' },
        name: putEventDto.name,
        description: putEventDto.description,
        date: new Date(putEventDto.date),
        time: putEventDto.time,
        isActive: putEventDto.isActive,
        ticketTypes: putEventDto.ticketTypes,
      };
      
      repository.findById.mockResolvedValueOnce(originalEvent);
      repository.findById.mockResolvedValueOnce(updatedEvent);
      repository.update.mockResolvedValue(updatedEvent);
      eventNotificationService.publishEventChange.mockRejectedValue(new Error('Notification failed'));

      const result = await service.update('507f1f77bcf86cd799439011', putEventDto);

      expect(result).toEqual(updatedEvent);
      // Should not throw error, just log it
    });

    it('should publish event change notification for critical changes', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 31);
      const futureDate2Str = futureDate2.toISOString().split('T')[0];
      
      const originalEvent = { 
        ...mockEvent, 
        date: futureDateStr,
        time: '19:00' // Keep original time to trigger date_time_change
      };
      const updatedEvent = { 
        ...mockEvent, 
        date: futureDate2Str,
        time: '14:00', // Different time to trigger date_time_change
        name: putEventDto.name,
        description: putEventDto.description,
        isActive: putEventDto.isActive,
        ticketTypes: putEventDto.ticketTypes,
      };
      
      const putEventDtoWithNewDate = { ...putEventDto, date: futureDate2Str };
      
      repository.findById.mockResolvedValue(originalEvent);
      repository.update.mockResolvedValue(updatedEvent);
      eventNotificationService.publishEventChange.mockResolvedValue(undefined);

      // Mock the change notifier
      const eventChangeNotifier = module.get(EventChangeNotifier);
      eventChangeNotifier.notifyEventChange.mockResolvedValue(undefined);

      const result = await service.update('507f1f77bcf86cd799439011', putEventDtoWithNewDate);

      expect(result).toEqual(updatedEvent);
      expect(eventChangeNotifier.notifyEventChange).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.any(Object),
        expect.objectContaining({
          date: expect.any(Date)
        }),
        expect.any(Object)
      );
    });

  });

  describe('toggleActive', () => {
    it('should toggle event active status', async () => {
      const toggledEvent = { ...mockEvent, isActive: false, status: 'INACTIVE' };
      repository.findById.mockResolvedValue(mockEvent);
      repository.toggleActive.mockResolvedValue(toggledEvent);

      const result = await service.toggleActive('507f1f77bcf86cd799439011');

      expect(result).toEqual(toggledEvent);
      expect(repository.toggleActive).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException if event not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.toggleActive('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should publish activation notification when event becomes active', async () => {
      const inactiveEvent = { ...mockEvent, isActive: false, status: 'INACTIVE' };
      const activatedEvent = { ...mockEvent, isActive: true, status: 'ACTIVE' };
      
      repository.findById.mockResolvedValue(inactiveEvent);
      repository.toggleActive.mockResolvedValue(activatedEvent);
      
      // Mock the change notifier
      const eventChangeNotifier = module.get(EventChangeNotifier);
      eventChangeNotifier.notifyStatusChange.mockResolvedValue(undefined);

      const result = await service.toggleActive('507f1f77bcf86cd799439011');

      expect(result).toEqual(activatedEvent);
      expect(eventChangeNotifier.notifyStatusChange).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        inactiveEvent,
        activatedEvent
      );
    });

    it('should publish cancellation notification when event becomes inactive', async () => {
      const activeEvent = { ...mockEvent, isActive: true, status: 'ACTIVE' };
      const cancelledEvent = { ...mockEvent, isActive: false, status: 'INACTIVE' };
      
      repository.findById.mockResolvedValue(activeEvent);
      repository.toggleActive.mockResolvedValue(cancelledEvent);
      
      // Mock the change notifier
      const eventChangeNotifier = module.get(EventChangeNotifier);
      eventChangeNotifier.notifyStatusChange.mockResolvedValue(undefined);

      const result = await service.toggleActive('507f1f77bcf86cd799439011');

      expect(result).toEqual(cancelledEvent);
      expect(eventChangeNotifier.notifyStatusChange).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        activeEvent,
        cancelledEvent
      );
    });

    it('should not publish notification when status does not change', async () => {
      const activeEvent = { ...mockEvent, isActive: true };
      const sameEvent = { ...mockEvent, isActive: true };
      
      repository.findById.mockResolvedValue(activeEvent);
      repository.toggleActive.mockResolvedValue(sameEvent);

      const result = await service.toggleActive('507f1f77bcf86cd799439011');

      expect(result).toEqual(sameEvent);
      expect(eventNotificationService.publishEventChange).not.toHaveBeenCalled();
    });

    it('should handle error when publishing notification fails', async () => {
      const inactiveEvent = { ...mockEvent, isActive: false, status: 'INACTIVE' };
      const activatedEvent = { ...mockEvent, isActive: true, status: 'ACTIVE' };
      
      repository.findById.mockResolvedValue(inactiveEvent);
      repository.toggleActive.mockResolvedValue(activatedEvent);
      eventNotificationService.publishEventChange.mockRejectedValue(new Error('Notification failed'));

      const result = await service.toggleActive('507f1f77bcf86cd799439011');

      expect(result).toEqual(activatedEvent);
      // Should not throw error, just log it
    });
  });

  describe('remove', () => {
    it('should remove an event successfully', async () => {
      repository.findById.mockResolvedValue(mockEvent);
      repository.delete.mockResolvedValue(true);

      await service.remove('507f1f77bcf86cd799439011');

      expect(repository.delete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException if event not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if delete fails', async () => {
      repository.findById.mockResolvedValue(mockEvent);
      repository.delete.mockResolvedValue(false);

      await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
    });
  });

  describe('coordinate transformation', () => {
    it('should transform GeoJSON coordinates to {lat, lng} format in findOne', async () => {
      const eventWithGeoJSONCoordinates = {
        ...mockEvent,
        culturalPlaceId: {
          ...mockEvent.culturalPlaceId,
          contact: {
            ...mockEvent.culturalPlaceId.contact,
            coordinates: {
              type: 'Point',
              coordinates: [-58.40879856, -34.61724004] // [lng, lat]
            }
          }
        }
      };

      const expectedTransformedEvent = {
        ...eventWithGeoJSONCoordinates,
        culturalPlaceId: {
          ...eventWithGeoJSONCoordinates.culturalPlaceId,
          contact: {
            ...eventWithGeoJSONCoordinates.culturalPlaceId.contact,
            coordinates: {
              lat: -34.61724004,
              lng: -58.40879856
            }
          }
        }
      };

      repository.findById.mockResolvedValue(eventWithGeoJSONCoordinates);
      
      // Mock the transformer to return the transformed event
      const eventDataTransformer = module.get(EventDataTransformer);
      eventDataTransformer.transformEventCoordinates.mockReturnValue(expectedTransformedEvent);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(result.culturalPlaceId.contact.coordinates).toEqual({
        lat: -34.61724004,
        lng: -58.40879856
      });
    });

    it('should transform GeoJSON coordinates to {lat, lng} format in findAll', async () => {
      const eventsWithGeoJSONCoordinates = [{
        ...mockEvent,
        culturalPlaceId: {
          ...mockEvent.culturalPlaceId,
          contact: {
            ...mockEvent.culturalPlaceId.contact,
            coordinates: {
              type: 'Point',
              coordinates: [-58.40879856, -34.61724004] // [lng, lat]
            }
          }
        }
      }];

      const expectedTransformedEvents = [{
        ...eventsWithGeoJSONCoordinates[0],
        culturalPlaceId: {
          ...eventsWithGeoJSONCoordinates[0].culturalPlaceId,
          contact: {
            ...eventsWithGeoJSONCoordinates[0].culturalPlaceId.contact,
            coordinates: {
              lat: -34.61724004,
              lng: -58.40879856
            }
          }
        }
      }];

      repository.findAll.mockResolvedValue(eventsWithGeoJSONCoordinates);
      
      // Mock the transformer to return the transformed events
      const eventDataTransformer = module.get(EventDataTransformer);
      eventDataTransformer.transformEventsCoordinates.mockReturnValue(expectedTransformedEvents);

      const result = await service.findAll();

      expect(result[0].culturalPlaceId.contact.coordinates).toEqual({
        lat: -34.61724004,
        lng: -58.40879856
      });
    });

    it('should transform GeoJSON coordinates to {lat, lng} format in findByCulturalPlace', async () => {
      const eventsWithGeoJSONCoordinates = [{
        ...mockEvent,
        culturalPlaceId: {
          ...mockEvent.culturalPlaceId,
          contact: {
            ...mockEvent.culturalPlaceId.contact,
            coordinates: {
              type: 'Point',
              coordinates: [-58.40879856, -34.61724004] // [lng, lat]
            }
          }
        }
      }];

      const expectedTransformedEvents = [{
        ...eventsWithGeoJSONCoordinates[0],
        culturalPlaceId: {
          ...eventsWithGeoJSONCoordinates[0].culturalPlaceId,
          contact: {
            ...eventsWithGeoJSONCoordinates[0].culturalPlaceId.contact,
            coordinates: {
              lat: -34.61724004,
              lng: -58.40879856
            }
          }
        }
      }];

      repository.findByCulturalPlace.mockResolvedValue(eventsWithGeoJSONCoordinates);
      
      // Mock the transformer to return the transformed events
      const eventDataTransformer = module.get(EventDataTransformer);
      eventDataTransformer.transformEventsCoordinates.mockReturnValue(expectedTransformedEvents);

      const result = await service.findByCulturalPlace('507f1f77bcf86cd799439012');

      expect(result[0].culturalPlaceId.contact.coordinates).toEqual({
        lat: -34.61724004,
        lng: -58.40879856
      });
    });

    it('should not transform coordinates if already in {lat, lng} format', async () => {
      const eventWithCorrectFormat = {
        ...mockEvent,
        culturalPlaceId: {
          ...mockEvent.culturalPlaceId,
          contact: {
            ...mockEvent.culturalPlaceId.contact,
            coordinates: {
              lat: -34.61724004,
              lng: -58.40879856
            }
          }
        }
      };

      repository.findById.mockResolvedValue(eventWithCorrectFormat);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(result.culturalPlaceId.contact.coordinates).toEqual({
        lat: -34.61724004,
        lng: -58.40879856
      });
    });

    it('should handle events without cultural place coordinates', async () => {
      const eventWithoutCoordinates = {
        ...mockEvent,
        culturalPlaceId: {
          ...mockEvent.culturalPlaceId,
          contact: {
            address: 'Agrelo 3045',
            phone: '49316157',
            website: 'https://example.com',
            email: 'info@lugar.com'
            // Sin coordenadas
          }
        }
      };

      repository.findById.mockResolvedValue(eventWithoutCoordinates);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(eventWithoutCoordinates);
    });
  });



});
