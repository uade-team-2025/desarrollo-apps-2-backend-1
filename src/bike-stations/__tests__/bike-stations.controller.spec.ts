import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { BikeStationsController } from '../bike-stations.controller';
import { BikeStationsService } from '../bike-stations.service';
import { CreateBikeStationDto } from '../dto/create-bike-station.dto';
import { UpdateStationDto } from '../dto/update-station.dto';

describe('BikeStationsController', () => {
  let controller: BikeStationsController;
  let service: BikeStationsService;

  const mockBikeStation = {
    _id: new Types.ObjectId(),
    eventId: new Types.ObjectId(),
    stations: [
      {
        lat: -34.603722,
        long: -58.381592,
        stationId: 'station-1',
        count: 10,
      },
      {
        lat: -34.604722,
        long: -58.382592,
        stationId: 'station-2',
        count: 5,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBikeStationsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEventId: jest.fn(),
    findByStationId: jest.fn(),
    updateStationInAllEvents: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BikeStationsController],
      providers: [
        {
          provide: BikeStationsService,
          useValue: mockBikeStationsService,
        },
      ],
    }).compile();

    controller = module.get<BikeStationsController>(BikeStationsController);
    service = module.get<BikeStationsService>(BikeStationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new bike station', async () => {
      const createDto: CreateBikeStationDto = {
        eventId: mockBikeStation.eventId,
        stations: mockBikeStation.stations,
      };

      mockBikeStationsService.create.mockResolvedValue(mockBikeStation);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockBikeStation);
      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when creating a bike station', async () => {
      const createDto: CreateBikeStationDto = {
        eventId: mockBikeStation.eventId,
        stations: mockBikeStation.stations,
      };

      const error = new Error('Database error');
      mockBikeStationsService.create.mockRejectedValue(error);

      await expect(controller.create(createDto)).rejects.toThrow(error);
    });
  });

  describe('findAll', () => {
    it('should return an array of bike stations', async () => {
      const bikeStations = [mockBikeStation];
      mockBikeStationsService.findAll.mockResolvedValue(bikeStations);

      const result = await controller.findAll();

      expect(result).toEqual(bikeStations);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no bike stations exist', async () => {
      mockBikeStationsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('should return a bike station by id', async () => {
      const id = mockBikeStation._id.toString();
      mockBikeStationsService.findById.mockResolvedValue(mockBikeStation);

      const result = await controller.findById(id);

      expect(result).toEqual(mockBikeStation);
      expect(service.findById).toHaveBeenCalledWith(id);
      expect(service.findById).toHaveBeenCalledTimes(1);
    });

    it('should return null when bike station is not found', async () => {
      const id = new Types.ObjectId().toString();
      mockBikeStationsService.findById.mockResolvedValue(null);

      const result = await controller.findById(id);

      expect(result).toBeNull();
      expect(service.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('findByEventId', () => {
    it('should return bike stations by event id', async () => {
      const eventId = mockBikeStation.eventId.toString();
      const bikeStations = [mockBikeStation];
      mockBikeStationsService.findByEventId.mockResolvedValue(bikeStations);

      const result = await controller.findByEventId(eventId);

      expect(result).toEqual(bikeStations);
      expect(service.findByEventId).toHaveBeenCalledWith(eventId);
      expect(service.findByEventId).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no bike stations found for event', async () => {
      const eventId = new Types.ObjectId().toString();
      mockBikeStationsService.findByEventId.mockResolvedValue([]);

      const result = await controller.findByEventId(eventId);

      expect(result).toEqual([]);
      expect(service.findByEventId).toHaveBeenCalledWith(eventId);
    });
  });

  describe('findByStationId', () => {
    it('should return bike stations containing a specific stationId', async () => {
      const stationId = 'station-1';
      const bikeStations = [mockBikeStation];
      mockBikeStationsService.findByStationId.mockResolvedValue(bikeStations);

      const result = await controller.findByStationId(stationId);

      expect(result).toEqual(bikeStations);
      expect(service.findByStationId).toHaveBeenCalledWith(stationId);
      expect(service.findByStationId).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when station is not found', async () => {
      const stationId = 'non-existent-station';
      mockBikeStationsService.findByStationId.mockResolvedValue([]);

      const result = await controller.findByStationId(stationId);

      expect(result).toEqual([]);
      expect(service.findByStationId).toHaveBeenCalledWith(stationId);
    });
  });

  describe('updateStationInAllEvents', () => {
    it('should update a station in all events', async () => {
      const updateDto: UpdateStationDto = {
        stationId: 'station-1',
        lat: -34.605,
        count: 15,
      };

      const expectedResult = {
        modifiedCount: 2,
        stationId: 'station-1',
        updatedFields: {
          lat: -34.605,
          count: 15,
        },
      };

      mockBikeStationsService.updateStationInAllEvents.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.updateStationInAllEvents(updateDto);

      expect(result).toEqual(expectedResult);
      expect(service.updateStationInAllEvents).toHaveBeenCalledWith(updateDto);
      expect(service.updateStationInAllEvents).toHaveBeenCalledTimes(1);
    });

    it('should handle partial updates', async () => {
      const updateDto: UpdateStationDto = {
        stationId: 'station-1',
        count: 20,
      };

      const expectedResult = {
        modifiedCount: 3,
        stationId: 'station-1',
        updatedFields: {
          count: 20,
        },
      };

      mockBikeStationsService.updateStationInAllEvents.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.updateStationInAllEvents(updateDto);

      expect(result).toEqual(expectedResult);
      expect(service.updateStationInAllEvents).toHaveBeenCalledWith(updateDto);
    });

    it('should handle errors when station is not found', async () => {
      const updateDto: UpdateStationDto = {
        stationId: 'non-existent-station',
        count: 10,
      };

      const error = new NotFoundException(
        'Station with id non-existent-station not found in any event',
      );
      mockBikeStationsService.updateStationInAllEvents.mockRejectedValue(error);

      await expect(
        controller.updateStationInAllEvents(updateDto),
      ).rejects.toThrow(error);
    });

    it('should handle errors when no fields are provided', async () => {
      const updateDto: UpdateStationDto = {
        stationId: 'station-1',
      };

      const error = new Error('At least one field must be provided for update');
      mockBikeStationsService.updateStationInAllEvents.mockRejectedValue(error);

      await expect(
        controller.updateStationInAllEvents(updateDto),
      ).rejects.toThrow(error);
    });
  });
});
