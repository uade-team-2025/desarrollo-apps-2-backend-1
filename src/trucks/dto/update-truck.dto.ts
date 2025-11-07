import { Type } from 'class-transformer';
import { IsNumber, IsOptional, ValidateNested } from 'class-validator';

export class UpdatePositionDto {
  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  long?: number;
}

export class UpdateTruckDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePositionDto)
  position?: UpdatePositionDto;
}
