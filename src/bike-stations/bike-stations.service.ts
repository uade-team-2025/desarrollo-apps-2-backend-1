import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBikeStationDto } from './dto/create-bike-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { BikeStationsRepository } from './repositories/bike-stations.repository';
import { BikeStationDocument } from './schemas/bike-station.schema';

@Injectable()
export class BikeStationsService {
  constructor(
    private readonly bikeStationsRepository: BikeStationsRepository,
  ) {}

  async create(
    createBikeStationDto: CreateBikeStationDto,
  ): Promise<BikeStationDocument> {
    return this.bikeStationsRepository.create(createBikeStationDto);
  }

  async findAll(): Promise<BikeStationDocument[]> {
    return this.bikeStationsRepository.findAll();
  }

  async findById(id: string): Promise<BikeStationDocument | null> {
    return this.bikeStationsRepository.findById(id);
  }

  async findByEventId(eventId: string): Promise<BikeStationDocument[]> {
    return this.bikeStationsRepository.findByEventId(eventId);
  }

  async findByStationId(stationId: string): Promise<BikeStationDocument[]> {
    return this.bikeStationsRepository.findByStationId(stationId);
  }

  async updateStationInAllEvents(updateStationDto: UpdateStationDto): Promise<{
    modifiedCount: number;
    stationId: string;
    updatedFields: Partial<UpdateStationDto>;
  }> {
    const { stationId, ...updateData } = updateStationDto;

    // Verificar que al menos un campo se esté actualizando
    if (Object.keys(updateData).length === 0) {
      throw new Error('At least one field must be provided for update');
    }

    // Verificar que la estación existe en al menos un evento
    const existingStations =
      await this.bikeStationsRepository.findByStationId(stationId);
    if (existingStations.length === 0) {
      throw new NotFoundException(
        `Station with id ${stationId} not found in any event`,
      );
    }

    const result = await this.bikeStationsRepository.updateStationInAllEvents(
      stationId,
      updateData,
    );

    return {
      modifiedCount: result.modifiedCount,
      stationId,
      updatedFields: updateData,
    };
  }
}
