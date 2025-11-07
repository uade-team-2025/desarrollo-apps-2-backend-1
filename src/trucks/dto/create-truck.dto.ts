import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';

export class PositionDto {
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @IsNumber()
  @IsNotEmpty()
  long: number;
}

export class CreateTruckDto {
  @IsMongoId()
  @IsNotEmpty()
  eventId: Types.ObjectId;

  @IsNotEmpty()
  truckId: string;

  @ValidateNested()
  @Type(() => PositionDto)
  @IsNotEmpty()
  position: PositionDto;
}
