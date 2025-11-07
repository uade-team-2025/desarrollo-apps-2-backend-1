import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { CreateTruckDto } from '../dto/create-truck.dto';
import { UpdateTruckDto } from '../dto/update-truck.dto';
import { TrucksController } from '../trucks.controller';
import { TrucksService } from '../trucks.service';

describe('TrucksController', () => {
  let controller: TrucksController;
  let service: TrucksService;

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

  const mockTrucksService = {
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
      controllers: [TrucksController],
      providers: [
        {
          provide: TrucksService,
          useValue: mockTrucksService,
        },
      ],
    }).compile();

    controller = module.get<TrucksController>(TrucksController);
    service = module.get<TrucksService>(TrucksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new truck', async () => {
      const createDto: CreateTruckDto = {
        eventId: mockTruck.eventId,
        truckId: mockTruck.truckId,
        position: mockTruck.position,
      };

      mockTrucksService.create.mockResolvedValue(mockTruck);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockTruck);
      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException when truck already exists', async () => {
      const createDto: CreateTruckDto = {
        eventId: mockTruck.eventId,
        truckId: mockTruck.truckId,
        position: mockTruck.position,
      };

      const error = new ConflictException(
        `Truck with id ${createDto.truckId} already exists for event ${createDto.eventId}`,
      );
      mockTrucksService.create.mockRejectedValue(error);

      await expect(controller.create(createDto)).rejects.toThrow(error);
    });
  });

  describe('findAll', () => {
    it('should return an array of trucks', async () => {
      const trucks = [mockTruck];
      mockTrucksService.findAll.mockResolvedValue(trucks);

      const result = await controller.findAll();

      expect(result).toEqual(trucks);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no trucks exist', async () => {
      mockTrucksService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return a truck by id', async () => {
      const id = mockTruck._id.toString();
      mockTrucksService.findById.mockResolvedValue(mockTruck);

      const result = await controller.findById(id);

      expect(result).toEqual(mockTruck);
      expect(service.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when truck is not found', async () => {
      const id = new Types.ObjectId().toString();
      const error = new NotFoundException(`Truck with id ${id} not found`);
      mockTrucksService.findById.mockRejectedValue(error);

      await expect(controller.findById(id)).rejects.toThrow(error);
    });
  });

  describe('findByEventId', () => {
    it('should return trucks by event id', async () => {
      const eventId = mockTruck.eventId.toString();
      const trucks = [mockTruck];
      mockTrucksService.findByEventId.mockResolvedValue(trucks);

      const result = await controller.findByEventId(eventId);

      expect(result).toEqual(trucks);
      expect(service.findByEventId).toHaveBeenCalledWith(eventId);
    });

    it('should return empty array when no trucks found for event', async () => {
      const eventId = new Types.ObjectId().toString();
      mockTrucksService.findByEventId.mockResolvedValue([]);

      const result = await controller.findByEventId(eventId);

      expect(result).toEqual([]);
    });
  });

  describe('findByTruckId', () => {
    it('should return trucks by truck id', async () => {
      const truckId = 'truck-1';
      const trucks = [mockTruck];
      mockTrucksService.findByTruckId.mockResolvedValue(trucks);

      const result = await controller.findByTruckId(truckId);

      expect(result).toEqual(trucks);
      expect(service.findByTruckId).toHaveBeenCalledWith(truckId);
    });
  });

  describe('findByEventAndTruckId', () => {
    it('should return a truck by event and truck id', async () => {
      const eventId = mockTruck.eventId.toString();
      const truckId = 'truck-1';
      mockTrucksService.findByEventAndTruckId.mockResolvedValue(mockTruck);

      const result = await controller.findByEventAndTruckId(eventId, truckId);

      expect(result).toEqual(mockTruck);
      expect(service.findByEventAndTruckId).toHaveBeenCalledWith(
        eventId,
        truckId,
      );
    });

    it('should throw NotFoundException when truck is not found', async () => {
      const eventId = new Types.ObjectId().toString();
      const truckId = 'non-existent-truck';
      const error = new NotFoundException(
        `Truck with id ${truckId} not found for event ${eventId}`,
      );
      mockTrucksService.findByEventAndTruckId.mockRejectedValue(error);

      await expect(
        controller.findByEventAndTruckId(eventId, truckId),
      ).rejects.toThrow(error);
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
      mockTrucksService.update.mockResolvedValue(updatedTruck);

      const result = await controller.update(id, updateDto);

      expect(result).toEqual(updatedTruck);
      expect(service.update).toHaveBeenCalledWith(id, updateDto);
    });

    it('should throw NotFoundException when truck is not found', async () => {
      const id = new Types.ObjectId().toString();
      const updateDto: UpdateTruckDto = {
        position: { lat: -34.605 },
      };
      const error = new NotFoundException(`Truck with id ${id} not found`);
      mockTrucksService.update.mockRejectedValue(error);

      await expect(controller.update(id, updateDto)).rejects.toThrow(error);
    });
  });

  describe('updateByEventAndTruckId', () => {
    it('should update a truck by event and truck id', async () => {
      const eventId = mockTruck.eventId.toString();
      const truckId = 'truck-1';
      const updateDto: UpdateTruckDto = {
        position: {
          lat: -34.605,
          long: -58.385,
        },
      };

      const updatedTruck = { ...mockTruck, ...updateDto };
      mockTrucksService.updateByEventAndTruckId.mockResolvedValue(updatedTruck);

      const result = await controller.updateByEventAndTruckId(
        eventId,
        truckId,
        updateDto,
      );

      expect(result).toEqual(updatedTruck);
      expect(service.updateByEventAndTruckId).toHaveBeenCalledWith(
        eventId,
        truckId,
        updateDto,
      );
    });
  });

  describe('delete', () => {
    it('should delete a truck', async () => {
      const id = mockTruck._id.toString();
      mockTrucksService.delete.mockResolvedValue(mockTruck);

      const result = await controller.delete(id);

      expect(result).toEqual(mockTruck);
      expect(service.delete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when truck is not found', async () => {
      const id = new Types.ObjectId().toString();
      const error = new NotFoundException(`Truck with id ${id} not found`);
      mockTrucksService.delete.mockRejectedValue(error);

      await expect(controller.delete(id)).rejects.toThrow(error);
    });
  });

  describe('deleteByEventAndTruckId', () => {
    it('should delete a truck by event and truck id', async () => {
      const eventId = mockTruck.eventId.toString();
      const truckId = 'truck-1';
      mockTrucksService.deleteByEventAndTruckId.mockResolvedValue(mockTruck);

      const result = await controller.deleteByEventAndTruckId(eventId, truckId);

      expect(result).toEqual(mockTruck);
      expect(service.deleteByEventAndTruckId).toHaveBeenCalledWith(
        eventId,
        truckId,
      );
    });

    it('should throw NotFoundException when truck is not found', async () => {
      const eventId = new Types.ObjectId().toString();
      const truckId = 'non-existent-truck';
      const error = new NotFoundException(
        `Truck with id ${truckId} not found for event ${eventId}`,
      );
      mockTrucksService.deleteByEventAndTruckId.mockRejectedValue(error);

      await expect(
        controller.deleteByEventAndTruckId(eventId, truckId),
      ).rejects.toThrow(error);
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
      const response = {
        truck: newTruck,
        wasCreated: true,
      };
      mockTrucksService.upsert.mockResolvedValue(response);

      const result = await controller.upsert(createTruckDto);

      expect(result).toEqual(response);
      expect(service.upsert).toHaveBeenCalledWith(createTruckDto);
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
      const response = {
        truck: updatedTruck,
        wasCreated: false,
      };
      mockTrucksService.upsert.mockResolvedValue(response);

      const result = await controller.upsert(createTruckDto);

      expect(result).toEqual(response);
    });
  });
});
