import { IsLatitude, IsLongitude } from 'class-validator';

export class ActivateCulturalPlaceByLocationDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;
}


