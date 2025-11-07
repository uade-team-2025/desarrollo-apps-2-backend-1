import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MongoDBEventRepository } from '../mongodb-event.repository';
import { Event, EventDocument } from '../../schemas/event.schema';

describe('MongoDBEventRepository', () => {
  let repository: MongoDBEventRepository;
  let model: Model<EventDocument>;

  const mockCulturalPlace = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test Cultural Place',
    description: 'Test description',
    category: 'Museo',
    characteristics: ['Arte', 'Historia'],
    contact: {
      address: 'Test Address',
      coordinates: { lat: -34.61724004, lng: -58.40879856 },
      phone: '123456789',
      website: 'https://test.com',
      email: 'test@test.com',
    },
    image: 'https://test.com/image.jpg',
    rating: 4.5,
  };

  const mockEvent = {
    _id: '507f1f77bcf86cd799439012',
    culturalPlaceId: mockCulturalPlace,
    name: 'Test Event',
    description: 'Test event description',
    date: new Date('2024-12-25'),
    time: '18:00',
    image: 'https://example.com/event-image.jpg',
    ticketTypes: [
      {
        type: 'general',
        price: 100,
        initialQuantity: 50,
        soldQuantity: 10,
        isActive: true,
      },
    ],
    isActive: true,
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    // Crear un mock que funcione como constructor
    const MockModel = jest.fn().mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(mockEvent),
    }));

    // Agregar métodos estáticos al mock
    (MockModel as any).find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockEvent]),
        }),
      }),
    });
    (MockModel as any).findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEvent),
      }),
    });
    (MockModel as any).findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockEvent),
    });
    (MockModel as any).findByIdAndDelete = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockEvent),
    });
    (MockModel as any).updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    (MockModel as any).updateMany = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ modifiedCount: 3 }),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongoDBEventRepository,
        {
          provide: getModelToken(Event.name),
          useValue: MockModel,
        },
      ],
    }).compile();

    repository = module.get<MongoDBEventRepository>(MongoDBEventRepository);
    model = module.get<Model<EventDocument>>(getModelToken(Event.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new event', async () => {
      const createEventDto = {
        culturalPlaceId: '507f1f77bcf86cd799439011',
        name: 'Test Event',
        description: 'Test description',
        date: new Date('2024-12-25'),
        time: '18:00',
        ticketTypes: mockEvent.ticketTypes,
        isActive: true,
      };

      const result = await repository.create(createEventDto);

      expect(model).toHaveBeenCalledWith(expect.objectContaining({
        ...createEventDto,
        isActive: true,
        status: 'ACTIVE',
      }));
      expect(result).toEqual(mockEvent);
    });
  });

  describe('updateManyByCulturalPlace', () => {
    it('should update events for a cultural place', async () => {
      const culturalPlaceId = '507f1f77bcf86cd799439099';

      const result = await repository.updateManyByCulturalPlace(culturalPlaceId, {
        status: 'PAUSED_BY_CLOSURE',
        isActive: false,
      }, { status: { $ne: 'PAUSED_BY_CLOSURE' } });

      expect(model.updateMany).toHaveBeenCalledWith(
        {
          culturalPlaceId: new Types.ObjectId(culturalPlaceId),
          status: { $ne: 'PAUSED_BY_CLOSURE' },
        },
        { $set: { status: 'PAUSED_BY_CLOSURE', isActive: false } }
      );
      expect(result).toBe(3);
    });
  });

  describe('findAll', () => {
    it('should find all events without filters', async () => {
      const result = await repository.findAll();

      expect(model.find).toHaveBeenCalledWith({});
      expect(result).toEqual([mockEvent]);
    });

    it('should find events with cultural place filter', async () => {
      const query = { culturalPlaceId: '507f1f77bcf86cd799439011' };

      const result = await repository.findAll(query);

      expect(model.find).toHaveBeenCalledWith({
        culturalPlaceId: new Types.ObjectId('507f1f77bcf86cd799439011'),
      });
      expect(result).toEqual([mockEvent]);
    });
  });

  describe('findById', () => {
    it('should find an event by id', async () => {
      const eventId = '507f1f77bcf86cd799439012';

      const result = await repository.findById(eventId);

      expect(model.findById).toHaveBeenCalledWith(eventId);
      expect(result).toEqual(mockEvent);
    });
  });

  describe('update', () => {
    it('should update an event', async () => {
      const eventId = '507f1f77bcf86cd799439012';
      const updateEventDto = {
        name: 'Updated Event',
        description: 'Updated description',
      };

      const result = await repository.update(eventId, updateEventDto);

      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(eventId, updateEventDto, { new: true });
      expect(result).toEqual(mockEvent);
    });
  });

  describe('delete', () => {
    it('should delete an event and return true', async () => {
      const eventId = '507f1f77bcf86cd799439012';

      const result = await repository.delete(eventId);

      expect(model.findByIdAndDelete).toHaveBeenCalledWith(eventId);
      expect(result).toBe(true);
    });
  });

  describe('updateTicketCount', () => {
    it('should update ticket count successfully', async () => {
      const eventId = '507f1f77bcf86cd799439012';
      const ticketType = 'general';
      const quantity = 5;

      const result = await repository.updateTicketCount(eventId, ticketType, quantity);

      expect(model.updateOne).toHaveBeenCalledWith(
        {
          _id: new Types.ObjectId(eventId),
          'ticketTypes.type': ticketType,
          'ticketTypes.isActive': true,
        },
        {
          $inc: { 'ticketTypes.$.soldQuantity': quantity },
        }
      );
      expect(result).toBe(true);
    });
  });
});
