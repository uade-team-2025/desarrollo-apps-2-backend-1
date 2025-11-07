import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';

export class StationDto {
  @IsNotEmpty()
  lat: number;

  @IsNotEmpty()
  long: number;

  @IsNotEmpty()
  stationId: string;

  @IsNotEmpty()
  count: number;
}

export class CreateBikeStationDto {
  @IsMongoId()
  @IsNotEmpty()
  eventId: Types.ObjectId;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one station is required' })
  @ValidateNested({ each: true })
  @Type(() => StationDto)
  stations: StationDto[];
}
