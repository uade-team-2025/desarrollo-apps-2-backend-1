import { IsString, IsArray, IsNumber, IsBoolean, IsOptional, IsDateString, Min, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class TicketTypePutDto {
  @ApiProperty({ example: 'general', description: 'Type of ticket (any string)' })
  @IsString()
  type: string;

  @ApiProperty({ example: 800, minimum: 0, description: 'Price of the ticket' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 25, minimum: 1, description: 'Initial quantity available' })
  @IsNumber()
  @Min(1)
  initialQuantity: number;

  @ApiProperty({ example: 1, minimum: 0, description: 'Quantity sold' })
  @IsNumber()
  @Min(0)
  soldQuantity: number;
}

export class PutEventDto {
  @ApiProperty({ example: 'Taller de Pinturas', description: 'Name of the event' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Taller de técnicas de pintura moderna', description: 'Description of the event' })
  @IsString()
  description: string;

  @ApiProperty({ example: '2025-11-20', description: 'Date of the event' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '14:00', description: 'Time of the event' })
  @IsString()
  time: string;

  @ApiProperty({ example: true, description: 'Whether the event is active' })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ example: 'ACTIVE', description: 'Estado operativo del evento', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ type: [TicketTypePutDto], description: 'Ticket types (completely editable)' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TicketTypePutDto)
  ticketTypes: TicketTypePutDto[];
}
