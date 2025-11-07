import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { CreateTruckDto } from '../dto/create-truck.dto';
import { UpdateTruckDto } from '../dto/update-truck.dto';
import { TrucksRepository } from '../repositories/trucks.repository';
import { Truck } from '../schemas/truck.schema';

describe('TrucksRepository', () => {
  let repository: TrucksRepository;

  const mockTruck = {
    _id: new Types.ObjectId(),
    eventId: new Types.ObjectId(),
    truckId: 'truck-1',
    position: {
      lat: -34.603722,
      long: -58.381592,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSave = jest.fn().mockResolvedValue(mockTruck);

  const mockTruckModel: any = jest.fn().mockImplementation(() => ({
    save: mockSave,
  }));

  mockTruckModel.find = jest.fn();
  mockTruckModel.findById = jest.fn();
  mockTruckModel.findOne = jest.fn();
  mockTruckModel.findByIdAndUpdate = jest.fn();
  mockTruckModel.findOneAndUpdate = jest.fn();
  mockTruckModel.findByIdAndDelete = jest.fn();
  mockTruckModel.findOneAndDelete = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrucksRepository,
        {
          provide: getModelToken(Truck.name),
          useValue: mockTruckModel,
        },
      ],
    }).compile();

    repository = module.get<TrucksRepository>(TrucksRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new truck', async () => {
      const createDto: CreateTruckDto = {
        eventId: mockTruck.eventId,
        truckId: mockTruck.truckId,
        position: mockTruck.position,
      };

      const result = await repository.create(createDto);

      expect(mockTruckModel).toHaveBeenCalledWith(createDto);
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(mockTruck);
    });
  });

  describe('findAll', () => {
    it('should return all trucks', async () => {
      const trucks = [mockTruck];

      mockTruckModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(trucks),
      });

      const result = await repository.findAll();

      expect(result).toEqual(trucks);
      expect(mockTruckModel.find).toHaveBeenCalled();
    });

    it('should return empty array when no trucks exist', async () => {
      mockTruckModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return a truck by id', async () => {
      const id = mockTruck._id.toString();

      mockTruckModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTruck),
      });

      const result = await repository.findById(id);

      expect(result).toEqual(mockTruck);
      expect(mockTruckModel.findById).toHaveBeenCalledWith(id);
    });

    it('should return null when truck not found', async () => {
      const id = new Types.ObjectId().toString();

      mockTruckModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findById(id);

      expect(result).toBeNull();
    });
  });

  describe('findByEventId', () => {
    it('should return trucks by event id', async () => {
      const eventId = mockTruck.eventId.toString();
      const trucks = [mockTruck];

      mockTruckModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(trucks),
      });

      const result = await repository.findByEventId(eventId);

      expect(result).toEqual(trucks);
      expect(mockTruckModel.find).toHaveBeenCalledWith({ eventId });
    });

    it('should return empty array when no trucks found', async () => {
      const eventId = new Types.ObjectId().toString();

      mockTruckModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findByEventId(eventId);

      expect(result).toEqual([]);
    });
  });

  describe('findByTruckId', () => {
    it('should return trucks by truck id', async () => {
      const truckId = 'truck-1';
      const trucks = [mockTruck];

      mockTruckModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(trucks),
      });

      const result = await repository.findByTruckId(truckId);

      expect(result).toEqual(trucks);
      expect(mockTruckModel.find).toHaveBeenCalledWith({ truckId });
    });
  });

  describe('findByEventAndTruckId', () => {
    it('should return a truck by event and truck id', async () => {
      const eventId = mockTruck.eventId.toString();
      const truckId = 'truck-1';

      mockTruckModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTruck),
      });

      const result = await repository.findByEventAndTruckId(eventId, truckId);

      expect(result).toEqual(mockTruck);
      expect(mockTruckModel.findOne).toHaveBeenCalledWith({ eventId, truckId });
    });

    it('should return null when truck not found', async () => {
      const eventId = new Types.ObjectId().toString();
      const truckId = 'non-existent-truck';

      mockTruckModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findByEventAndTruckId(eventId, truckId);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a truck', async () => {
      const id = mockTruck._id.toString();
      const updateDto: UpdateTruckDto = {
        position: {
          lat: -34.605,
          long: -58.385,
        },
      };

      const updatedTruck = { ...mockTruck, ...updateDto };

      mockTruckModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedTruck),
      });

      const result = await repository.update(id, updateDto);

      expect(result).toEqual(updatedTruck);
      expect(mockTruckModel.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        updateDto,
        { new: true },
      );
    });

    it('should return null when truck not found', async () => {
      const id = new Types.ObjectId().toString();
      const updateDto: UpdateTruckDto = {
        position: { lat: -34.605 },
      };

      mockTruckModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.update(id, updateDto);

      expect(result).toBeNull();
    });
  });

  describe('updateByEventAndTruckId', () => {
    it('should update a truck by event and truck id', async () => {
      const eventId = mockTruck.eventId.toString();
      const truckId = 'truck-1';
      const updateDto: UpdateTruckDto = {
        position: {
          lat: -34.605,
        },
      };

      const updatedTruck = { ...mockTruck, ...updateDto };

      mockTruckModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedTruck),
      });

      const result = await repository.updateByEventAndTruckId(
        eventId,
        truckId,
        updateDto,
      );

      expect(result).toEqual(updatedTruck);
      expect(mockTruckModel.findOneAndUpdate).toHaveBeenCalledWith(
        { eventId, truckId },
        updateDto,
        { new: true },
      );
    });

    it('should return null when truck not found', async () => {
      const eventId = new Types.ObjectId().toString();
      const truckId = 'non-existent-truck';
      const updateDto: UpdateTruckDto = {
        position: { lat: -34.605 },
      };

      mockTruckModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.updateByEventAndTruckId(
        eventId,
        truckId,
        updateDto,
      );

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a truck', async () => {
      const id = mockTruck._id.toString();

      mockTruckModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTruck),
      });

      const result = await repository.delete(id);

      expect(result).toEqual(mockTruck);
      expect(mockTruckModel.findByIdAndDelete).toHaveBeenCalledWith(id);
    });

    it('should return null when truck not found', async () => {
      const id = new Types.ObjectId().toString();

      mockTruckModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.delete(id);

      expect(result).toBeNull();
    });
  });

  describe('deleteByEventAndTruckId', () => {
    it('should delete a truck by event and truck id', async () => {
      const eventId = mockTruck.eventId.toString();
      const truckId = 'truck-1';

      mockTruckModel.findOneAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTruck),
      });

      const result = await repository.deleteByEventAndTruckId(eventId, truckId);

      expect(result).toEqual(mockTruck);
      expect(mockTruckModel.findOneAndDelete).toHaveBeenCalledWith({
        eventId,
        truckId,
      });
    });

    it('should return null when truck not found', async () => {
      const eventId = new Types.ObjectId().toString();
      const truckId = 'non-existent-truck';

      mockTruckModel.findOneAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.deleteByEventAndTruckId(eventId, truckId);

      expect(result).toBeNull();
    });
  });

  describe('upsert', () => {
    it('should create a new truck if it does not exist', async () => {
      const createTruckDto: CreateTruckDto = {
        eventId: mockTruck.eventId,
        truckId: 'new-truck',
        position: {
          lat: -34.6037,
          long: -58.3816,
        },
      };

      const newTruck = { ...mockTruck, ...createTruckDto };

      mockTruckModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(newTruck),
      });

      const result = await repository.upsert(createTruckDto);

      expect(result).toEqual(newTruck);
      expect(mockTruckModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          eventId: createTruckDto.eventId,
          truckId: createTruckDto.truckId,
        },
        createTruckDto,
        {
          new: true,
          upsert: true,
        },
      );
    });

    it('should update an existing truck', async () => {
      const createTruckDto: CreateTruckDto = {
        eventId: mockTruck.eventId,
        truckId: 'truck-1',
        position: {
          lat: -34.605,
          long: -58.385,
        },
      };

      const updatedTruck = { ...mockTruck, ...createTruckDto };

      mockTruckModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedTruck),
      });

      const result = await repository.upsert(createTruckDto);

      expect(result).toEqual(updatedTruck);
    });
  });
});
