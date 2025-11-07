import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MobilityStationsService } from './mobility-stations.service';
import { MobilityStation } from './interfaces/mobility-stations-message.interface';

interface MobilityStationsRequest {
  eventId?: unknown;
  stations?: unknown;
}

@ApiTags('mobility')
@Controller('mobility/stations')
export class MobilityStationsController {
  constructor(private readonly mobilityStationsService: MobilityStationsService) {}

  @Post('mock')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Publicar un mensaje mock en la cola movilidad.estaciones.festivalverde',
    description:
      'Encola un mensaje de estaciones mockeadas. Acepta un array de estaciones o un único objeto para actualizaciones puntuales.',
  })
  @ApiResponse({ status: 202, description: 'Mensaje encolado correctamente' })
  async publishMockMessage(@Body() body: MobilityStationsRequest) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('El cuerpo de la petición es requerido.');
    }

    const eventId = this.parseEventId(body.eventId);
    const { stations, mode } = this.parseStations(body.stations);

    const message = await this.mobilityStationsService.publishStations(eventId, stations, mode);

    return {
      status: 'queued',
      mode,
      eventId: message.eventId,
      totalStations: message.metadata.totalStations,
      sentAt: message.metadata.sentAt,
    };
  }

  private parseEventId(eventId: unknown): string {
    if (typeof eventId !== 'string' || eventId.trim().length === 0) {
      throw new BadRequestException('eventId es obligatorio y debe ser una cadena.');
    }
    return eventId.trim();
  }

  private parseStations(rawStations: unknown): { stations: MobilityStation[]; mode: 'bulk' | 'update' } {
    if (!rawStations) {
      throw new BadRequestException('stations es obligatorio.');
    }

    const isArray = Array.isArray(rawStations);
    const candidateStations = (isArray ? rawStations : [rawStations]) as unknown[];

    if (candidateStations.length === 0) {
      throw new BadRequestException('stations debe contener al menos una estación.');
    }

    const stations = candidateStations.map((station, index) => this.parseStation(station, index));

    return {
      stations,
      mode: isArray ? 'bulk' : 'update',
    };
  }

  private parseStation(station: unknown, index: number): MobilityStation {
    if (!station || typeof station !== 'object') {
      throw new BadRequestException(`stations[${index}] debe ser un objeto con los datos de la estación.`);
    }

    const { stationId, lt, lg, count } = station as Record<string, unknown>;

    if (typeof stationId !== 'string' || stationId.trim().length === 0) {
      throw new BadRequestException(`stationId inválido en stations[${index}].`);
    }

    const parsedLt = this.parseNumber(lt, `lt inválido en stations[${index}].`);
    const parsedLg = this.parseNumber(lg, `lg inválido en stations[${index}].`);
    const parsedCount = this.parseNumber(count, `count inválido en stations[${index}].`);

    return {
      stationId: stationId.trim(),
      lt: parsedLt,
      lg: parsedLg,
      count: parsedCount,
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

