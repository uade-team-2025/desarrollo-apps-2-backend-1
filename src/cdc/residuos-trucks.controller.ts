import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { TruckMessage } from './interfaces/truck-message.interface';
import { TruckRepository } from './repositories/truck.repository';

@ApiTags('residuos')
@Controller('residuos/trucks')
export class ResiduosTrucksController {
  constructor(private readonly truckRepository: TruckRepository) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todas las rutas guardadas',
    description:
      'Devuelve todas las rutas registradas en la base de datos. Puede limitar la cantidad con el parámetro limit.',
  })
  @ApiResponse({ status: 200, description: 'Lista de rutas' })
  async getLatestTrucks(@Query('limit') limit?: string) {
    let limitNumber: number | undefined = undefined;
    if (limit) {
      limitNumber = parseInt(limit, 10);
      if (isNaN(limitNumber) || limitNumber < 1) {
        throw new BadRequestException('limit debe ser un número positivo.');
      }
    }
    return await this.truckRepository.getLatestTrucks(limitNumber);
  }

  @Get('ruta/:idRuta')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener ruta por ID de ruta',
    description:
      'Devuelve la información de una ruta específica por su id_ruta.',
  })
  @ApiResponse({ status: 200, description: 'Información de la ruta' })
  @ApiResponse({ status: 404, description: 'Ruta no encontrada' })
  async getTruckByIdRuta(@Param('idRuta') idRuta: string) {
    try {
      return await this.truckRepository.getTruckByIdRuta(idRuta);
    } catch (error: any) {
      if (error.message?.includes('No se encontró')) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Get('event/:eventId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener rutas por ID de evento',
    description:
      'Devuelve todas las rutas registradas para un evento específico.',
  })
  @ApiResponse({ status: 200, description: 'Lista de rutas del evento' })
  async getTrucksByEventId(@Param('eventId') eventId: string) {
    return await this.truckRepository.getLatestTrucksByEventId(eventId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Agregar o actualizar una ruta',
    description:
      'Recibe una ruta y la guarda o actualiza según el id_ruta. Si el id_ruta existe, actualiza; si no existe, crea una nueva ruta.',
  })
  @ApiResponse({
    status: 201,
    description: 'Ruta agregada o actualizada correctamente',
  })
  async createOrUpdateTruck(@Body() body: TruckMessage) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('El cuerpo de la petición es requerido.');
    }

    const truck = this.parseTruckMessage(body);

    await this.truckRepository.saveTruckMessage(truck);

    return {
      status: 'success',
      id_ruta: truck.id_ruta,
      message: 'Ruta agregada o actualizada correctamente',
    };
  }

  private parseTruckMessage(body: unknown): TruckMessage {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException(
        'El cuerpo de la petición debe ser un objeto.',
      );
    }

    const {
      id_ruta,
      indice_punto_actual,
      total_puntos,
      punto_actual,
      porcentaje_progreso,
      informacion_adicional,
    } = body as Record<string, unknown>;

    // Validar id_ruta
    if (typeof id_ruta !== 'string' || id_ruta.trim().length === 0) {
      throw new BadRequestException(
        'id_ruta es obligatorio y debe ser una cadena no vacía.',
      );
    }

    // Validar indice_punto_actual
    const parsedIndicePuntoActual = this.parseNumber(
      indice_punto_actual,
      'indice_punto_actual debe ser un número.',
    );

    // Validar total_puntos
    const parsedTotalPuntos = this.parseNumber(
      total_puntos,
      'total_puntos debe ser un número.',
    );

    // Validar punto_actual
    if (!punto_actual || typeof punto_actual !== 'object') {
      throw new BadRequestException(
        'punto_actual es obligatorio y debe ser un objeto con latitud y longitud.',
      );
    }

    const puntoActualObj = punto_actual as Record<string, unknown>;
    const latitud = this.parseNumber(
      puntoActualObj.latitud,
      'punto_actual.latitud debe ser un número.',
    );
    const longitud = this.parseNumber(
      puntoActualObj.longitud,
      'punto_actual.longitud debe ser un número.',
    );

    // Validar porcentaje_progreso
    const parsedPorcentajeProgreso = this.parseNumber(
      porcentaje_progreso,
      'porcentaje_progreso debe ser un número.',
    );

    if (parsedPorcentajeProgreso < 0 || parsedPorcentajeProgreso > 100) {
      throw new BadRequestException(
        'porcentaje_progreso debe estar entre 0 y 100.',
      );
    }

    // Validar informacion_adicional
    if (!Array.isArray(informacion_adicional)) {
      throw new BadRequestException('informacion_adicional debe ser un array.');
    }

    const parsedInformacionAdicional = informacion_adicional.map(
      (item, index) => {
        if (!item || typeof item !== 'object') {
          throw new BadRequestException(
            `informacion_adicional[${index}] debe ser un objeto.`,
          );
        }

        const itemObj = item as Record<string, unknown>;
        if (
          typeof itemObj.id_evento !== 'string' ||
          itemObj.id_evento.trim().length === 0
        ) {
          throw new BadRequestException(
            `informacion_adicional[${index}].id_evento es obligatorio y debe ser una cadena no vacía.`,
          );
        }

        return {
          id_evento: itemObj.id_evento.trim(),
        };
      },
    );

    return {
      id_ruta: id_ruta.trim(),
      indice_punto_actual: parsedIndicePuntoActual,
      total_puntos: parsedTotalPuntos,
      punto_actual: {
        latitud,
        longitud,
      },
      porcentaje_progreso: parsedPorcentajeProgreso,
      informacion_adicional: parsedInformacionAdicional,
    };
  }

  private parseNumber(value: unknown, errorMessage: string): number {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      throw new BadRequestException(errorMessage);
    }
    return parsed;
  }
}
