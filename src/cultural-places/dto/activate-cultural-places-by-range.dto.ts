import { IsLatitude, IsLongitude, IsNumber, Min } from 'class-validator';

export class ActivateCulturalPlacesByRangeDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsNumber()
  @Min(1)
  radiusInMeters: number;
}


