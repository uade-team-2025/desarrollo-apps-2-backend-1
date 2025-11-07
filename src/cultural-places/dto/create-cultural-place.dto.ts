import { IsString, IsArray, IsObject, IsNumber, IsBoolean, IsOptional, IsEmail, IsUrl, Min, Max, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ScheduleDto {
  @ApiProperty({ example: '10:00', description: 'Opening time' })
  @IsString()
  open: string;

  @ApiProperty({ example: '18:00', description: 'Closing time' })
  @IsString()
  close: string;

  @ApiProperty({ example: false, description: 'Indicates if the place is closed' })
  @IsBoolean()
  closed: boolean;
}

export class CoordinatesDto {
 @ApiProperty({ example: -34.6037, description: 'Latitude' })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: -58.3816, description: 'Longitude' })
  @IsNumber()
  lng: number;
}

export class ContactDto {
  @ApiProperty({ example: '14 De Julio 426', description: 'Address of the cultural place' })
  @IsString()
  address: string;

  @ApiProperty({ type: CoordinatesDto, description: 'Geographic coordinates' })
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates: CoordinatesDto;

  @ApiProperty({ example: '+54 11 4551-0070', description: 'Phone number' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'https://example.com', description: 'Website URL' })
  @IsUrl()
  website: string;

  @ApiProperty({ example: 'info@culturalplace.com', description: 'Email address' })
  @IsEmail()
  email: string;
}

export class SchedulesDto {
  @ApiProperty({ type: ScheduleDto, description: 'Monday schedule' })
  @ValidateNested()
  @Type(() => ScheduleDto)
  monday: ScheduleDto;

  @ApiProperty({ type: ScheduleDto, description: 'Tuesday schedule' })
  @ValidateNested()
  @Type(() => ScheduleDto)
  tuesday: ScheduleDto;

  @ApiProperty({ type: ScheduleDto, description: 'Wednesday schedule' })
  @ValidateNested()
  @Type(() => ScheduleDto)
  wednesday: ScheduleDto;

  @ApiProperty({ type: ScheduleDto, description: 'Thursday schedule' })
  @ValidateNested()
  @Type(() => ScheduleDto)
  thursday: ScheduleDto;

  @ApiProperty({ type: ScheduleDto, description: 'Friday schedule' })
  @ValidateNested()
  @Type(() => ScheduleDto)
  friday: ScheduleDto;

  @ApiProperty({ type: ScheduleDto, description: 'Saturday schedule' })
  @ValidateNested()
  @Type(() => ScheduleDto)
  saturday: ScheduleDto;

  @ApiProperty({ type: ScheduleDto, description: 'Sunday schedule' })
  @ValidateNested()
  @Type(() => ScheduleDto)
  sunday: ScheduleDto;
}

export class CreateCulturalPlaceDto {
  @ApiProperty({ example: 'Oihoy Casa Abierta', description: 'Name of the cultural place' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Un espacio cultural dedicado a promover el arte contemporáneo y las expresiones culturales locales', description: 'Description of the cultural place' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'Centro Cultural', description: 'Category of the cultural place' })
  @IsString()
  category: string;

  @ApiProperty({ example: ['Exposiciones', 'Talleres'], description: 'List of characteristics/features', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  characteristics?: string[];

  @ApiProperty({ type: SchedulesDto, description: 'Weekly schedules' })
  @ValidateNested()
  @Type(() => SchedulesDto)
  schedules: SchedulesDto;

  @ApiProperty({ type: ContactDto, description: 'Contact information' })
  @ValidateNested()
  @Type(() => ContactDto)
  contact: ContactDto;

  @ApiProperty({ example: 'https://picsum.photos/800/600', description: 'Image URL' })
  @IsUrl()
  image: string;

  @ApiProperty({ example: 4.5, minimum: 0, maximum: 5, description: 'Rating from 0 to 5', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiProperty({ example: true, description: 'Whether the place is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: '#FF6B6B', description: 'Color assigned to the place (auto-generated if not provided)', required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ example: 'ACTIVE', description: 'Estado operativo del espacio', required: false })
  @IsOptional()
  @IsString()
  status?: string;
}
