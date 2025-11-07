import { IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateStationDto {
  @IsNotEmpty()
  stationId: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  long?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  count?: number;
}
