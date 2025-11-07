import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { CreateBikeStationDto } from '../dto/create-bike-station.dto';
import { BikeStationsRepository } from '../repositories/bike-stations.repository';
import { BikeStation } from '../schemas/bike-station.schema';

describe('BikeStationsRepository', () => {
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

  const mockSave = jest.fn().mockResolvedValue(mockBikeStation);

  const mockBikeStationModel: any = jest.fn().mockImplementation(() => ({
    save: mockSave,
  }));

  mockBikeStationModel.find = jest.fn();
  mockBikeStationModel.findById = jest.fn();
  mockBikeStationModel.updateMany = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BikeStationsRepository,
        {
          provide: getModelToken(BikeStation.name),
          useValue: mockBikeStationModel,
        },
      ],
    }).compile();

    repository = module.get<BikeStationsRepository>(BikeStationsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new bike station', async () => {
      const createDto: CreateBikeStationDto = {
        eventId: mockBikeStation.eventId,
        stations: mockBikeStation.stations,
      };

      const result = await repository.create(createDto);

      expect(mockBikeStationModel).toHaveBeenCalledWith(createDto);
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(mockBikeStation);
    });
  });

  describe('findAll', () => {
    it('should return all bike stations', async () => {
      const bikeStations = [mockBikeStation];

      mockBikeStationModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(bikeStations),
      });

      const result = await repository.findAll();

      expect(result).toEqual(bikeStations);
      expect(mockBikeStationModel.find).toHaveBeenCalled();
    });

    it('should return empty array when no bike stations exist', async () => {
      mockBikeStationModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return a bike station by id', async () => {
      const id = mockBikeStation._id.toString();

      mockBikeStationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBikeStation),
      });

      const result = await repository.findById(id);

      expect(result).toEqual(mockBikeStation);
      expect(mockBikeStationModel.findById).toHaveBeenCalledWith(id);
    });

    it('should return null when bike station not found', async () => {
      const id = new Types.ObjectId().toString();

      mockBikeStationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findById(id);

      expect(result).toBeNull();
    });
  });

  describe('findByEventId', () => {
    it('should return bike stations by event id', async () => {
      const eventId = mockBikeStation.eventId.toString();
      const bikeStations = [mockBikeStation];

      mockBikeStationModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(bikeStations),
      });

      const result = await repository.findByEventId(eventId);

      expect(result).toEqual(bikeStations);
      expect(mockBikeStationModel.find).toHaveBeenCalledWith({ eventId });
    });

    it('should return empty array when no bike stations found', async () => {
      const eventId = new Types.ObjectId().toString();

      mockBikeStationModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findByEventId(eventId);

      expect(result).toEqual([]);
    });
  });

  describe('findByStationId', () => {
    it('should return bike stations containing a specific stationId', async () => {
      const stationId = 'station-1';
      const bikeStations = [mockBikeStation];

      mockBikeStationModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(bikeStations),
      });

      const result = await repository.findByStationId(stationId);

      expect(result).toEqual(bikeStations);
      expect(mockBikeStationModel.find).toHaveBeenCalledWith({
        'stations.stationId': stationId,
      });
    });

    it('should return empty array when station not found', async () => {
      const stationId = 'non-existent-station';

      mockBikeStationModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findByStationId(stationId);

      expect(result).toEqual([]);
    });
  });

  describe('updateStationInAllEvents', () => {
    it('should update lat and count for a station in all events', async () => {
      const stationId = 'station-1';
      const updateData: Partial<UpdateStationDto> = {
        lat: -34.605,
        count: 15,
      };

      mockBikeStationModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 2 }),
      });

      const result = await repository.updateStationInAllEvents(
        stationId,
        updateData,
      );

      expect(result.modifiedCount).toBe(2);
      expect(mockBikeStationModel.updateMany).toHaveBeenCalledWith(
        { 'stations.stationId': stationId },
        {
          $set: {
            'stations.$[elem].lat': -34.605,
            'stations.$[elem].count': 15,
          },
        },
        {
          arrayFilters: [{ 'elem.stationId': stationId }],
        },
      );
    });

    it('should update only count field', async () => {
      const stationId = 'station-1';
      const updateData: Partial<UpdateStationDto> = {
        count: 20,
      };

      mockBikeStationModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 3 }),
      });

      const result = await repository.updateStationInAllEvents(
        stationId,
        updateData,
      );

      expect(result.modifiedCount).toBe(3);
      expect(mockBikeStationModel.updateMany).toHaveBeenCalledWith(
        { 'stations.stationId': stationId },
        {
          $set: {
            'stations.$[elem].count': 20,
          },
        },
        {
          arrayFilters: [{ 'elem.stationId': stationId }],
        },
      );
    });

    it('should update all fields', async () => {
      const stationId = 'station-1';
      const updateData: Partial<UpdateStationDto> = {
        lat: -34.999999,
        long: -58.999999,
        count: 50,
      };

      mockBikeStationModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      });

      const result = await repository.updateStationInAllEvents(
        stationId,
        updateData,
      );

      expect(result.modifiedCount).toBe(1);
      expect(mockBikeStationModel.updateMany).toHaveBeenCalledWith(
        { 'stations.stationId': stationId },
        {
          $set: {
            'stations.$[elem].lat': -34.999999,
            'stations.$[elem].long': -58.999999,
            'stations.$[elem].count': 50,
          },
        },
        {
          arrayFilters: [{ 'elem.stationId': stationId }],
        },
      );
    });

    it('should return 0 modified count when station is not found', async () => {
      const stationId = 'non-existent-station';
      const updateData: Partial<UpdateStationDto> = {
        count: 10,
      };

      mockBikeStationModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      });

      const result = await repository.updateStationInAllEvents(
        stationId,
        updateData,
      );

      expect(result.modifiedCount).toBe(0);
    });
  });
});
