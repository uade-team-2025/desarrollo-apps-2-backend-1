import { Test, TestingModule } from '@nestjs/testing';
import { EventDataTransformer } from '../event-data.transformer';

describe('EventDataTransformer', () => {
  let service: EventDataTransformer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventDataTransformer],
    }).compile();

    service = module.get<EventDataTransformer>(EventDataTransformer);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('transformCreateEventData', () => {
    it('should transform create event data correctly', () => {
      const createEventDto = {
        name: 'Test Event',
        description: 'Test Description',
        date: '2025-12-31T20:00:00.000Z',
        time: '20:00',
        culturalPlaceId: '507f1f77bcf86cd799439011',
        image: 'https://example.com/image.jpg',
        isActive: true,
        ticketTypes: [
          {
            type: 'general',
            price: 1000,
            initialQuantity: 100,
          }
        ]
      };

      const result = service.transformCreateEventData(createEventDto);

      expect(result).toEqual({
        ...createEventDto,
        culturalPlaceId: expect.any(Object),
        date: new Date(createEventDto.date),
        isActive: true,
        status: 'ACTIVE',
        ticketTypes: [
          {
            type: 'general',
            price: 1000,
            initialQuantity: 100,
            soldQuantity: 0,
            isActive: true,
          }
        ]
      });
    });

    it('should set isActive to true by default for ticket types', () => {
      const createEventDto = {
        name: 'Test Event',
        description: 'Test Description',
        date: '2025-12-31T20:00:00.000Z',
        time: '20:00',
        culturalPlaceId: '507f1f77bcf86cd799439011',
        ticketTypes: [
          {
            type: 'general',
            price: 1000,
            initialQuantity: 100,
          }
        ]
      };

      const result = service.transformCreateEventData(createEventDto);

      expect(result.ticketTypes[0].isActive).toBe(true);
      expect(result.isActive).toBe(true);
      expect(result.status).toBe('ACTIVE');
    });

    it('should preserve isActive value when provided', () => {
      const createEventDto = {
        name: 'Test Event',
        description: 'Test Description',
        date: '2025-12-31T20:00:00.000Z',
        time: '20:00',
        culturalPlaceId: '507f1f77bcf86cd799439011',
        ticketTypes: [
          {
            type: 'general',
            price: 1000,
            initialQuantity: 100,
            isActive: false,
          }
        ]
      };

      const result = service.transformCreateEventData(createEventDto);

      expect(result.ticketTypes[0].isActive).toBe(false);
      expect(result.status).toBe('ACTIVE');
    });
  });

  describe('transformEventCoordinates', () => {
    it('should return event as-is if already in {lat, lng} format', () => {
      const event = {
        _id: '507f1f77bcf86cd799439011',
        culturalPlaceId: {
          contact: {
            coordinates: {
              lat: -34.61724004,
              lng: -58.40879856
            }
          }
        }
      };

      const result = service.transformEventCoordinates(event);

      expect(result).toEqual(event);
    });

    it('should transform GeoJSON coordinates to {lat, lng} format', () => {
      const event = {
        _id: '507f1f77bcf86cd799439011',
        culturalPlaceId: {
          contact: {
            coordinates: {
              type: 'Point',
              coordinates: [-58.40879856, -34.61724004] // [lng, lat]
            }
          }
        }
      };

      const result = service.transformEventCoordinates(event);

      expect(result.culturalPlaceId.contact.coordinates).toEqual({
        lat: -34.61724004,
        lng: -58.40879856
      });
    });

    it('should return event as-is if no coordinates', () => {
      const event = {
        _id: '507f1f77bcf86cd799439011',
        culturalPlaceId: {
          contact: {}
        }
      };

      const result = service.transformEventCoordinates(event);

      expect(result).toEqual(event);
    });

    it('should return event as-is if no culturalPlaceId', () => {
      const event = {
        _id: '507f1f77bcf86cd799439011'
      };

      const result = service.transformEventCoordinates(event);

      expect(result).toEqual(event);
    });
  });

  describe('transformEventsCoordinates', () => {
    it('should transform multiple events coordinates', () => {
      const events = [
        {
          _id: '507f1f77bcf86cd799439011',
          culturalPlaceId: {
            contact: {
              coordinates: {
                type: 'Point',
                coordinates: [-58.40879856, -34.61724004]
              }
            }
          }
        },
        {
          _id: '507f1f77bcf86cd799439012',
          culturalPlaceId: {
            contact: {
              coordinates: {
                lat: -34.61724004,
                lng: -58.40879856
              }
            }
          }
        }
      ];

      const result = service.transformEventsCoordinates(events);

      expect(result).toHaveLength(2);
      expect(result[0].culturalPlaceId.contact.coordinates).toEqual({
        lat: -34.61724004,
        lng: -58.40879856
      });
      expect(result[1].culturalPlaceId.contact.coordinates).toEqual({
        lat: -34.61724004,
        lng: -58.40879856
      });
    });
  });
});
