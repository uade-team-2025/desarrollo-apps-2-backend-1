import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { BikeStationsService } from './bike-stations.service';
import { CreateBikeStationDto } from './dto/create-bike-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';

@Controller('bike-stations')
export class BikeStationsController {
  constructor(private readonly bikeStationsService: BikeStationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createBikeStationDto: CreateBikeStationDto) {
    return this.bikeStationsService.create(createBikeStationDto);
  }

  @Get()
  async findAll() {
    return this.bikeStationsService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.bikeStationsService.findById(id);
  }

  @Get('event/:eventId')
  async findByEventId(@Param('eventId') eventId: string) {
    return this.bikeStationsService.findByEventId(eventId);
  }

  @Get('station/:stationId')
  async findByStationId(@Param('stationId') stationId: string) {
    return this.bikeStationsService.findByStationId(stationId);
  }

  @Patch('station/update')
  @HttpCode(HttpStatus.OK)
  async updateStationInAllEvents(@Body() updateStationDto: UpdateStationDto) {
    return this.bikeStationsService.updateStationInAllEvents(updateStationDto);
  }
}
