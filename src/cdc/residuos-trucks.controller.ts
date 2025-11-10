import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TruckRepository } from './repositories/truck.repository';

@ApiTags('residuos')
@Controller('residuos/trucks')
export class ResiduosTrucksController {
  constructor(private readonly truckRepository: TruckRepository) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener últimos camiones guardados',
    description:
      'Devuelve los últimos 50 camiones registrados en la base de datos',
  })
  @ApiResponse({ status: 200, description: 'Lista de camiones' })
  async getLatestTrucks() {
    return await this.truckRepository.getLatestTrucks();
  }

  @Get('event/:eventId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener camiones por ID de evento',
    description:
      'Devuelve todos los camiones registrados para un evento específico',
  })
  @ApiResponse({ status: 200, description: 'Lista de camiones del evento' })
  async getTrucksByEventId(@Param('eventId') eventId: string) {
    return await this.truckRepository.getLatestTrucksByEventId(eventId);
  }
}
