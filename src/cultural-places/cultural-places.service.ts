import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import { CULTURAL_PLACE_REPOSITORY } from './interfaces/cultural-place.repository.interface';
import type { ICulturalPlaceRepository } from './interfaces/cultural-place.repository.interface';
import { CreateCulturalPlaceDto } from './dto/create-cultural-place.dto';
import { UpdateCulturalPlaceDto } from './dto/update-cultural-place.dto';
import { CulturalPlaceQueryDto } from './interfaces/cultural-place.interface';
import { CulturalPlace } from './schemas/cultural-place.schema';
import { CoordinatesValidator } from './validators/coordinates.validator';
import { SchedulesValidator } from './validators/schedules.validator';
import { CoordinatesTransformer } from '../common/transformers/coordinates.transformer';
import { ColorService } from '../common/services/color.service';

@Injectable()
export class CulturalPlacesService {
  constructor(
    @Inject(CULTURAL_PLACE_REPOSITORY)
    private readonly culturalPlaceRepository: ICulturalPlaceRepository,
  ) {}

  async create(createCulturalPlaceDto: CreateCulturalPlaceDto): Promise<CulturalPlace> {
    try {
      console.log('Creating cultural place with data:', JSON.stringify(createCulturalPlaceDto, null, 2));
      
      const existingPlace = await this.culturalPlaceRepository.findByName(createCulturalPlaceDto.name);

      if (existingPlace) {
        throw new ConflictException('A cultural place with this name already exists');
      }

      if (createCulturalPlaceDto.contact?.coordinates) {
        CoordinatesValidator.validate(createCulturalPlaceDto.contact.coordinates);
      }

      SchedulesValidator.validate(createCulturalPlaceDto.schedules);

      // Transformar coordenadas de {lat, lng} a GeoJSON para almacenamiento (Front end maneja distinto formato)
      const transformedData = {
        ...createCulturalPlaceDto,
        isActive: true,
        status: 'ACTIVE',
        color: createCulturalPlaceDto.color || ColorService.generateRandomColor(),
        contact: {
          ...createCulturalPlaceDto.contact,
          coordinates: CoordinatesTransformer.toGeoJSON(createCulturalPlaceDto.contact.coordinates)
        }
      };

      console.log('Processed cultural place data:', JSON.stringify(transformedData, null, 2));

      return await this.culturalPlaceRepository.create(transformedData as any);
    } catch (error) {
      console.error('Error creating cultural place:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error creating cultural place: ${error.message}`);
    }
  }

  async findAll(query: CulturalPlaceQueryDto = {}): Promise<CulturalPlace[]> {
    const places = await this.culturalPlaceRepository.findAll(query);
    return places.map(place => CoordinatesTransformer.fromGeoJSON((place as any).toObject ? (place as any).toObject() : place));
  }

  async findOne(id: string): Promise<CulturalPlace> {
    const place = await this.culturalPlaceRepository.findById(id);
    
    if (!place) {
      throw new NotFoundException('Cultural place not found');
    }

    return CoordinatesTransformer.fromGeoJSON((place as any).toObject ? (place as any).toObject() : place);
  }

  async update(id: string, updateCulturalPlaceDto: UpdateCulturalPlaceDto): Promise<CulturalPlace> {
    try {
      const existingPlace = await this.findOne(id);

      if (updateCulturalPlaceDto.name && updateCulturalPlaceDto.name !== existingPlace.name) {
        const duplicateName = await this.culturalPlaceRepository.findByName(updateCulturalPlaceDto.name);

        if (duplicateName) {
          throw new ConflictException('A cultural place with this name already exists');
        }
      }

      const transformedUpdateDto = { ...updateCulturalPlaceDto };
      
      if (transformedUpdateDto.contact?.coordinates) {
        CoordinatesValidator.validate(transformedUpdateDto.contact.coordinates);
        // Transformar coordenadas de {lat, lng} a GeoJSON para almacenamiento
        transformedUpdateDto.contact = {
          ...transformedUpdateDto.contact,
          coordinates: CoordinatesTransformer.toGeoJSON(transformedUpdateDto.contact.coordinates) as any
        };
      }

      if (updateCulturalPlaceDto.schedules) {
        SchedulesValidator.validate(updateCulturalPlaceDto.schedules);
      }

      const updatedPlace = await this.culturalPlaceRepository.update(id, transformedUpdateDto as any);

      return CoordinatesTransformer.fromGeoJSON((updatedPlace as any).toObject ? (updatedPlace as any).toObject() : updatedPlace);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error updating cultural place');
    }
  }

  async toggleActive(id: string): Promise<CulturalPlace> {
    const place = await this.findOne(id);
    
    const updatedPlace = await this.culturalPlaceRepository.update(id, {
      isActive: !place.isActive,
    });

    if (!updatedPlace) {
      throw new NotFoundException('Error updating place status');
    }

    return CoordinatesTransformer.fromGeoJSON((updatedPlace as any).toObject ? (updatedPlace as any).toObject() : updatedPlace);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    
    const success = await this.culturalPlaceRepository.delete(id);
    
    if (!success) {
      throw new NotFoundException('Error deleting cultural place');
    }
  }

  async findByCategory(category: string): Promise<CulturalPlace[]> {
    const places = await this.culturalPlaceRepository.findByCategory(category);
    return places.map(place => CoordinatesTransformer.fromGeoJSON((place as any).toObject ? (place as any).toObject() : place));
  }

  async findOpenPlaces(dayOfWeek: string): Promise<CulturalPlace[]> {
    const places = await this.culturalPlaceRepository.findOpenPlaces(dayOfWeek);
    return places.map(place => CoordinatesTransformer.fromGeoJSON((place as any).toObject ? (place as any).toObject() : place));
  }

  async findTopRated(limit: number = 10): Promise<CulturalPlace[]> {
    const places = await this.culturalPlaceRepository.findTopRated(limit);
    return places.map(place => CoordinatesTransformer.fromGeoJSON((place as any).toObject ? (place as any).toObject() : place));
  }

}
