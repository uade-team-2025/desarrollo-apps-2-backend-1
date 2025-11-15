import { IsEnum, IsLatitude, IsLongitude } from 'class-validator';

export enum EventCancellationStatus {
  CLOSED_DOWN = 'CLOSED_DOWN',
  TEMPORAL_CLOSED_DOWN = 'TEMPORAL_CLOSED_DOWN',
}

export class CancelEventByLocationDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsEnum(EventCancellationStatus)
  status: EventCancellationStatus;
}


