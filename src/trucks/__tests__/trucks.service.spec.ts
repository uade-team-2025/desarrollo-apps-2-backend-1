import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { CreateTruckDto } from '../dto/create-truck.dto';
import { UpdateTruckDto } from '../dto/update-truck.dto';
import { TrucksRepository } from '../repositories/trucks.repository';
import { TrucksService } from '../trucks.service';

describe('TrucksService', () => {
  let service: TrucksService;
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

  const mockTrucksRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEventId: jest.fn(),
    findByTruckId: jest.fn(),
    findByEventAndTruckId: jest.fn(),
    update: jest.fn(),
    updateByEventAndTruckId: jest.fn(),
    delete: jest.fn(),
    deleteByEventAndTruckId: jest.fn(),
    upsert: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrucksService,
        {
          provide: TrucksRepository,
          useValue: mockTrucksRepository,
        },
      ],
    }).compile();

    service = module.get<TrucksService>(TrucksService);
    repository = module.get<TrucksRepository>(TrucksRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new truck', async () => {
      const createDto: CreateTruckDto = {
        eventId: mockTruck.eventId,
        truckId: mockTruck.truckId,
        position: mockTruck.position,
      };

      mockTrucksRepository.findByEventAndTruckId.mockResolvedValue(null);
      mockTrucksRepository.create.mockResolvedValue(mockTruck);

      const result = await service.create(createDto);

      expect(result).toEqual(mockTruck);
      expect(repository.findByEventAndTruckId).toHaveBeenCalledWith(
        createDto.eventId.toString(),
        createDto.truckId,
      );
      expect(repository.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException when truck already exists', async () => {
      const createDto: CreateTruckDto = {
        eventId: mockTruck.eventId,
        truckId: mockTruck.truckId,
        position: mockTruck.position,
      };

      mockTrucksRepository.findByEventAndTruckId.mockResolvedValue(mockTruck);

      await expect(service.create(createDto)).rejects.toThrow(
        new ConflictException(
          `Truck with id ${createDto.truckId} already exists for event ${createDto.eventId}`,
        ),
      );
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all trucks', async () => {
      const trucks = [mockTruck];
      mockTrucksRepository.findAll.mockResolvedValue(trucks);

      const result = await service.findAll();

      expect(result).toEqual(trucks);
      expect(repository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no trucks exist', async () => {
      mockTrucksRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return a truck by id', async () => {
      const id = mockTruck._id.toString();
      mockTrucksRepository.findById.mockResolvedValue(mockTruck);

      const result = await service.findById(id);

      expect(result).toEqual(mockTruck);
      expect(repository.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when truck not found', async () => {
      const id = new Types.ObjectId().toString();
      mockTrucksRepository.findById.mockResolvedValue(null);

      await expect(service.findById(id)).rejects.toThrow(
        new NotFoundException(`Truck with id ${id} not found`),
      );
    });
  });

  describe('findByEventId', () => {
    it('should return trucks by event id', async () => {
      const eventId = mockTruck.eventId.toString();
      const trucks = [mockTruck];
      mockTrucksRepository.findByEventId.mockResolvedValue(trucks);

      const result = await service.findByEventId(eventId);

      expect(result).toEqual(trucks);
      expect(repository.findByEventId).toHaveBeenCalledWith(eventId);
    });
  });

  describe('findByTruckId', () => {
    it('should return trucks by truck id', async () => {
      const truckId = 'truck-1';
      const trucks = [mockTruck];
      mockTrucksRepository.findByTruckId.mockResolvedValue(trucks);

      const result = await service.findByTruckId(truckId);

      expect(result).toEqual(trucks);
      expect(repository.findByTruckId).toHaveBeenCalledWith(truckId);
    });
  });

  describe('findByEventAndTruckId', () => {
    it('should return a truck by event and truck id', async () => {
      const eventId = mockTruck.eventId.toString();
      const truckId = 'truck-1';
      mockTrucksRepository.findByEventAndTruckId.mockResolvedValue(mockTruck);

      const result = await service.findByEventAndTruckId(eventId, truckId);

      expect(result).toEqual(mockTruck);
      expect(repository.findByEventAndTruckId).toHaveBeenCalledWith(
        eventId,
        truckId,
      );
    });

    it('should throw NotFoundException when truck not found', async () => {
      const eventId = new Types.ObjectId().toString();
      const truckId = 'non-existent-truck';
      mockTrucksRepository.findByEventAndTruckId.mockResolvedValue(null);

      await expect(
        service.findByEventAndTruckId(eventId, truckId),
      ).rejects.toThrow(
        new NotFoundException(
          `Truck with id ${truckId} not found for event ${eventId}`,
        ),
      );
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
      mockTrucksRepository.update.mockResolvedValue(updatedTruck);

      const result = await service.update(id, updateDto);

      expect(result).toEqual(updatedTruck);
      expect(repository.update).toHaveBeenCalledWith(id, updateDto);
    });

    it('should throw NotFoundException when truck not found', async () => {
      const id = new Types.ObjectId().toString();
      const updateDto: UpdateTruckDto = {
        position: { lat: -34.605 },
      };
      mockTrucksRepository.update.mockResolvedValue(null);

      await expect(service.update(id, updateDto)).rejects.toThrow(
        new NotFoundException(`Truck with id ${id} not found`),
      );
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
      mockTrucksRepository.updateByEventAndTruckId.mockResolvedValue(
        updatedTruck,
      );

      const result = await service.updateByEventAndTruckId(
        eventId,
        truckId,
        updateDto,
      );

      expect(result).toEqual(updatedTruck);
      expect(repository.updateByEventAndTruckId).toHaveBeenCalledWith(
        eventId,
        truckId,
        updateDto,
      );
    });

    it('should throw NotFoundException when truck not found', async () => {
      const eventId = new Types.ObjectId().toString();
      const truckId = 'non-existent-truck';
      const updateDto: UpdateTruckDto = {
        position: { lat: -34.605 },
      };
      mockTrucksRepository.updateByEventAndTruckId.mockResolvedValue(null);

      await expect(
        service.updateByEventAndTruckId(eventId, truckId, updateDto),
      ).rejects.toThrow(
        new NotFoundException(
          `Truck with id ${truckId} not found for event ${eventId}`,
        ),
      );
    });
  });

  describe('delete', () => {
    it('should delete a truck', async () => {
      const id = mockTruck._id.toString();
      mockTrucksRepository.delete.mockResolvedValue(mockTruck);

      const result = await service.delete(id);

      expect(result).toEqual(mockTruck);
      expect(repository.delete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when truck not found', async () => {
      const id = new Types.ObjectId().toString();
      mockTrucksRepository.delete.mockResolvedValue(null);

      await expect(service.delete(id)).rejects.toThrow(
        new NotFoundException(`Truck with id ${id} not found`),
      );
    });
  });

  describe('deleteByEventAndTruckId', () => {
    it('should delete a truck by event and truck id', async () => {
      const eventId = mockTruck.eventId.toString();
      const truckId = 'truck-1';
      mockTrucksRepository.deleteByEventAndTruckId.mockResolvedValue(mockTruck);

      const result = await service.deleteByEventAndTruckId(eventId, truckId);

      expect(result).toEqual(mockTruck);
      expect(repository.deleteByEventAndTruckId).toHaveBeenCalledWith(
        eventId,
        truckId,
      );
    });

    it('should throw NotFoundException when truck not found', async () => {
      const eventId = new Types.ObjectId().toString();
      const truckId = 'non-existent-truck';
      mockTrucksRepository.deleteByEventAndTruckId.mockResolvedValue(null);

      await expect(
        service.deleteByEventAndTruckId(eventId, truckId),
      ).rejects.toThrow(
        new NotFoundException(
          `Truck with id ${truckId} not found for event ${eventId}`,
        ),
      );
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
      mockTrucksRepository.findByEventAndTruckId.mockResolvedValue(null);
      mockTrucksRepository.upsert.mockResolvedValue(newTruck);

      const result = await service.upsert(createTruckDto);

      expect(result).toEqual({
        truck: newTruck,
        wasCreated: true,
      });
      expect(repository.findByEventAndTruckId).toHaveBeenCalledWith(
        createTruckDto.eventId.toString(),
        createTruckDto.truckId,
      );
      expect(repository.upsert).toHaveBeenCalledWith(createTruckDto);
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
      mockTrucksRepository.findByEventAndTruckId.mockResolvedValue(mockTruck);
      mockTrucksRepository.upsert.mockResolvedValue(updatedTruck);

      const result = await service.upsert(createTruckDto);

      expect(result).toEqual({
        truck: updatedTruck,
        wasCreated: false,
      });
    });
  });
});
