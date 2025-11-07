import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { TrucksRepository } from './repositories/trucks.repository';
import { TruckDocument } from './schemas/truck.schema';

@Injectable()
export class TrucksService {
  constructor(private readonly trucksRepository: TrucksRepository) {}

  async create(createTruckDto: CreateTruckDto): Promise<TruckDocument> {
    // Verificar si ya existe un truck con el mismo eventId y truckId
    const existingTruck = await this.trucksRepository.findByEventAndTruckId(
      createTruckDto.eventId.toString(),
      createTruckDto.truckId,
    );

    if (existingTruck) {
      throw new ConflictException(
        `Truck with id ${createTruckDto.truckId} already exists for event ${createTruckDto.eventId}`,
      );
    }

    return this.trucksRepository.create(createTruckDto);
  }

  async findAll(): Promise<TruckDocument[]> {
    return this.trucksRepository.findAll();
  }

  async findById(id: string): Promise<TruckDocument> {
    const truck = await this.trucksRepository.findById(id);
    if (!truck) {
      throw new NotFoundException(`Truck with id ${id} not found`);
    }
    return truck;
  }

  async findByEventId(eventId: string): Promise<TruckDocument[]> {
    return this.trucksRepository.findByEventId(eventId);
  }

  async findByTruckId(truckId: string): Promise<TruckDocument[]> {
    return this.trucksRepository.findByTruckId(truckId);
  }

  async findByEventAndTruckId(
    eventId: string,
    truckId: string,
  ): Promise<TruckDocument> {
    const truck = await this.trucksRepository.findByEventAndTruckId(
      eventId,
      truckId,
    );
    if (!truck) {
      throw new NotFoundException(
        `Truck with id ${truckId} not found for event ${eventId}`,
      );
    }
    return truck;
  }

  async update(
    id: string,
    updateTruckDto: UpdateTruckDto,
  ): Promise<TruckDocument> {
    const truck = await this.trucksRepository.update(id, updateTruckDto);
    if (!truck) {
      throw new NotFoundException(`Truck with id ${id} not found`);
    }
    return truck;
  }

  async updateByEventAndTruckId(
    eventId: string,
    truckId: string,
    updateTruckDto: UpdateTruckDto,
  ): Promise<TruckDocument> {
    const truck = await this.trucksRepository.updateByEventAndTruckId(
      eventId,
      truckId,
      updateTruckDto,
    );
    if (!truck) {
      throw new NotFoundException(
        `Truck with id ${truckId} not found for event ${eventId}`,
      );
    }
    return truck;
  }

  async delete(id: string): Promise<TruckDocument> {
    const truck = await this.trucksRepository.delete(id);
    if (!truck) {
      throw new NotFoundException(`Truck with id ${id} not found`);
    }
    return truck;
  }

  async deleteByEventAndTruckId(
    eventId: string,
    truckId: string,
  ): Promise<TruckDocument> {
    const truck = await this.trucksRepository.deleteByEventAndTruckId(
      eventId,
      truckId,
    );
    if (!truck) {
      throw new NotFoundException(
        `Truck with id ${truckId} not found for event ${eventId}`,
      );
    }
    return truck;
  }

  async upsert(createTruckDto: CreateTruckDto): Promise<{
    truck: TruckDocument;
    wasCreated: boolean;
  }> {
    // Verificar si ya existe
    const existingTruck = await this.trucksRepository.findByEventAndTruckId(
      createTruckDto.eventId.toString(),
      createTruckDto.truckId,
    );

    const truck = await this.trucksRepository.upsert(createTruckDto);

    return {
      truck,
      wasCreated: !existingTruck,
    };
  }
}
