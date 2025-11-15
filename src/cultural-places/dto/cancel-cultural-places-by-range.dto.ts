import { IsEnum, IsLatitude, IsLongitude, IsNumber, Min } from 'class-validator';
import { CulturalPlaceClosureStatus } from './cancel-cultural-place-by-location.dto';

export class CancelCulturalPlacesByRangeDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsNumber()
  @Min(1)
  radiusInMeters: number;

  @IsEnum(CulturalPlaceClosureStatus)
  status: CulturalPlaceClosureStatus;
}


