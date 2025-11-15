import { CulturalPlace } from '../schemas/cultural-place.schema';
import { CreateCulturalPlaceDto } from '../dto/create-cultural-place.dto';
import { UpdateCulturalPlaceDto } from '../dto/update-cultural-place.dto';
import { CulturalPlaceQueryDto } from './cultural-place.interface';

export const CULTURAL_PLACE_REPOSITORY = 'CULTURAL_PLACE_REPOSITORY';

export interface ICulturalPlaceRepository {
  create(data: CreateCulturalPlaceDto): Promise<CulturalPlace>;
  findAll(query?: CulturalPlaceQueryDto): Promise<CulturalPlace[]>;
  findById(id: string): Promise<CulturalPlace | null>;
  findByName(name: string): Promise<CulturalPlace | null>;
  findByCoordinates(latitude: number, longitude: number, radiusInMeters?: number): Promise<CulturalPlace | null>;
  update(id: string, data: UpdateCulturalPlaceDto): Promise<CulturalPlace | null>;
  delete(id: string): Promise<boolean>;
  findByCategory(category: string): Promise<CulturalPlace[]>;
  findTopRated(limit: number): Promise<CulturalPlace[]>;
  findOpenPlaces(dayOfWeek: string): Promise<CulturalPlace[]>;
}
