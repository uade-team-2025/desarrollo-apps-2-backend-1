import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { BikeStationsService } from '../bike-stations.service';
import { CreateBikeStationDto } from '../dto/create-bike-station.dto';
import { UpdateStationDto } from '../dto/update-station.dto';
import { BikeStationsRepository } from '../repositories/bike-stations.repository';

describe('BikeStationsService', () => {
  let service: BikeStationsService;
  let repository: BikeStationsRepository;

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
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBikeStationsRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEventId: jest.fn(),
    findByStationId: jest.fn(),
    updateStationInAllEvents: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BikeStationsService,
        {
          provide: BikeStationsRepository,
          useValue: mockBikeStationsRepository,
        },
      ],
    }).compile();

    service = module.get<BikeStationsService>(BikeStationsService);
    repository = module.get<BikeStationsRepository>(BikeStationsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new bike station', async () => {
      const createDto: CreateBikeStationDto = {
        eventId: mockBikeStation.eventId,
        stations: mockBikeStation.stations,
      };

      mockBikeStationsRepository.create.mockResolvedValue(mockBikeStation);

      const result = await service.create(createDto);

      expect(result).toEqual(mockBikeStation);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.create).toHaveBeenCalledTimes(1);
    });

    it('should propagate repository errors', async () => {
      const createDto: CreateBikeStationDto = {
        eventId: mockBikeStation.eventId,
        stations: mockBikeStation.stations,
      };

      const error = new Error('Repository error');
      mockBikeStationsRepository.create.mockRejectedValue(error);

      await expect(service.create(createDto)).rejects.toThrow(error);
    });
  });

  describe('findAll', () => {
    it('should return all bike stations', async () => {
      const bikeStations = [mockBikeStation];
      mockBikeStationsRepository.findAll.mockResolvedValue(bikeStations);

      const result = await service.findAll();

      expect(result).toEqual(bikeStations);
      expect(repository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no bike stations exist', async () => {
      mockBikeStationsRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return a bike station by id', async () => {
      const id = mockBikeStation._id.toString();
      mockBikeStationsRepository.findById.mockResolvedValue(mockBikeStation);

      const result = await service.findById(id);

      expect(result).toEqual(mockBikeStation);
      expect(repository.findById).toHaveBeenCalledWith(id);
    });

    it('should return null when bike station not found', async () => {
      const id = new Types.ObjectId().toString();
      mockBikeStationsRepository.findById.mockResolvedValue(null);

      const result = await service.findById(id);

      expect(result).toBeNull();
    });
  });

  describe('findByEventId', () => {
    it('should return bike stations by event id', async () => {
      const eventId = mockBikeStation.eventId.toString();
      const bikeStations = [mockBikeStation];
      mockBikeStationsRepository.findByEventId.mockResolvedValue(bikeStations);

      const result = await service.findByEventId(eventId);

      expect(result).toEqual(bikeStations);
      expect(repository.findByEventId).toHaveBeenCalledWith(eventId);
    });

    it('should return empty array when no bike stations found for event', async () => {
      const eventId = new Types.ObjectId().toString();
      mockBikeStationsRepository.findByEventId.mockResolvedValue([]);

      const result = await service.findByEventId(eventId);

      expect(result).toEqual([]);
    });
  });

  describe('findByStationId', () => {
    it('should return bike stations containing a specific stationId', async () => {
      const stationId = 'station-1';
      const bikeStations = [mockBikeStation];
      mockBikeStationsRepository.findByStationId.mockResolvedValue(
        bikeStations,
      );

      const result = await service.findByStationId(stationId);

      expect(result).toEqual(bikeStations);
      expect(repository.findByStationId).toHaveBeenCalledWith(stationId);
    });

    it('should return empty array when station not found', async () => {
      const stationId = 'non-existent-station';
      mockBikeStationsRepository.findByStationId.mockResolvedValue([]);

      const result = await service.findByStationId(stationId);

      expect(result).toEqual([]);
    });
  });

  describe('updateStationInAllEvents', () => {
    it('should update a station in all events successfully', async () => {
      const updateDto: UpdateStationDto = {
        stationId: 'station-1',
        lat: -34.605,
        count: 15,
      };

      const bikeStations = [mockBikeStation];
      mockBikeStationsRepository.findByStationId.mockResolvedValue(
        bikeStations,
      );
      mockBikeStationsRepository.updateStationInAllEvents.mockResolvedValue({
        modifiedCount: 2,
      });

      const result = await service.updateStationInAllEvents(updateDto);

      expect(result).toEqual({
        modifiedCount: 2,
        stationId: 'station-1',
        updatedFields: {
          lat: -34.605,
          count: 15,
        },
      });
      expect(repository.findByStationId).toHaveBeenCalledWith('station-1');
      expect(repository.updateStationInAllEvents).toHaveBeenCalledWith(
        'station-1',
        {
          lat: -34.605,
          count: 15,
        },
      );
    });

    it('should handle partial updates', async () => {
      const updateDto: UpdateStationDto = {
        stationId: 'station-1',
        count: 20,
      };

      const bikeStations = [mockBikeStation];
      mockBikeStationsRepository.findByStationId.mockResolvedValue(
        bikeStations,
      );
      mockBikeStationsRepository.updateStationInAllEvents.mockResolvedValue({
        modifiedCount: 3,
      });

      const result = await service.updateStationInAllEvents(updateDto);

      expect(result).toEqual({
        modifiedCount: 3,
        stationId: 'station-1',
        updatedFields: {
          count: 20,
        },
      });
      expect(repository.updateStationInAllEvents).toHaveBeenCalledWith(
        'station-1',
        {
          count: 20,
        },
      );
    });

    it('should throw NotFoundException when station is not found in any event', async () => {
      const updateDto: UpdateStationDto = {
        stationId: 'non-existent-station',
        count: 10,
      };

      mockBikeStationsRepository.findByStationId.mockResolvedValue([]);

      await expect(service.updateStationInAllEvents(updateDto)).rejects.toThrow(
        new NotFoundException(
          'Station with id non-existent-station not found in any event',
        ),
      );
      expect(repository.findByStationId).toHaveBeenCalledWith(
        'non-existent-station',
      );
      expect(repository.updateStationInAllEvents).not.toHaveBeenCalled();
    });

    it('should throw error when no fields are provided for update', async () => {
      const updateDto: UpdateStationDto = {
        stationId: 'station-1',
      };

      await expect(service.updateStationInAllEvents(updateDto)).rejects.toThrow(
        'At least one field must be provided for update',
      );
      expect(repository.findByStationId).not.toHaveBeenCalled();
      expect(repository.updateStationInAllEvents).not.toHaveBeenCalled();
    });

    it('should update only lat field', async () => {
      const updateDto: UpdateStationDto = {
        stationId: 'station-1',
        lat: -34.999999,
      };

      const bikeStations = [mockBikeStation];
      mockBikeStationsRepository.findByStationId.mockResolvedValue(
        bikeStations,
      );
      mockBikeStationsRepository.updateStationInAllEvents.mockResolvedValue({
        modifiedCount: 1,
      });

      const result = await service.updateStationInAllEvents(updateDto);

      expect(result.updatedFields).toEqual({ lat: -34.999999 });
      expect(repository.updateStationInAllEvents).toHaveBeenCalledWith(
        'station-1',
        {
          lat: -34.999999,
        },
      );
    });

    it('should update all fields', async () => {
      const updateDto: UpdateStationDto = {
        stationId: 'station-1',
        lat: -34.999999,
        long: -58.999999,
        count: 50,
      };

      const bikeStations = [mockBikeStation];
      mockBikeStationsRepository.findByStationId.mockResolvedValue(
        bikeStations,
      );
      mockBikeStationsRepository.updateStationInAllEvents.mockResolvedValue({
        modifiedCount: 4,
      });

      const result = await service.updateStationInAllEvents(updateDto);

      expect(result).toEqual({
        modifiedCount: 4,
        stationId: 'station-1',
        updatedFields: {
          lat: -34.999999,
          long: -58.999999,
          count: 50,
        },
      });
    });
  });
});
