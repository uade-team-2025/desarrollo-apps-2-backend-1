import { IsEnum, IsLatitude, IsLongitude } from 'class-validator';

export enum CulturalPlaceClosureStatus {
  CLOSED_DOWN = 'CLOSED_DOWN',
  TEMPORAL_CLOSED_DOWN = 'TEMPORAL_CLOSED_DOWN',
}

export class CancelCulturalPlaceByLocationDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsEnum(CulturalPlaceClosureStatus)
  status: CulturalPlaceClosureStatus;
}


