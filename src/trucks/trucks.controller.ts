import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { TrucksService } from './trucks.service';

@Controller('trucks')
export class TrucksController {
  constructor(private readonly trucksService: TrucksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTruckDto: CreateTruckDto) {
    return this.trucksService.create(createTruckDto);
  }

  @Get()
  async findAll() {
    return this.trucksService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.trucksService.findById(id);
  }

  @Get('event/:eventId')
  async findByEventId(@Param('eventId') eventId: string) {
    return this.trucksService.findByEventId(eventId);
  }

  @Get('truck/:truckId')
  async findByTruckId(@Param('truckId') truckId: string) {
    return this.trucksService.findByTruckId(truckId);
  }

  @Get('event/:eventId/truck/:truckId')
  async findByEventAndTruckId(
    @Param('eventId') eventId: string,
    @Param('truckId') truckId: string,
  ) {
    return this.trucksService.findByEventAndTruckId(eventId, truckId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateTruckDto: UpdateTruckDto,
  ) {
    return this.trucksService.update(id, updateTruckDto);
  }

  @Patch('event/:eventId/truck/:truckId')
  @HttpCode(HttpStatus.OK)
  async updateByEventAndTruckId(
    @Param('eventId') eventId: string,
    @Param('truckId') truckId: string,
    @Body() updateTruckDto: UpdateTruckDto,
  ) {
    return this.trucksService.updateByEventAndTruckId(
      eventId,
      truckId,
      updateTruckDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    return this.trucksService.delete(id);
  }

  @Delete('event/:eventId/truck/:truckId')
  @HttpCode(HttpStatus.OK)
  async deleteByEventAndTruckId(
    @Param('eventId') eventId: string,
    @Param('truckId') truckId: string,
  ) {
    return this.trucksService.deleteByEventAndTruckId(eventId, truckId);
  }

  @Put('upsert')
  @HttpCode(HttpStatus.OK)
  async upsert(@Body() createTruckDto: CreateTruckDto) {
    return this.trucksService.upsert(createTruckDto);
  }
}
