import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { MobilityStation } from './interfaces/mobility-stations-message.interface';
import { MobilityStationsService } from './mobility-stations.service';
import { MobilityStationRepository } from './repositories/mobility-station.repository';

interface AddStationsToEventRequest {
  eventId: unknown;
  stations: unknown;
}

interface UpdateStationRequest {
  station: unknown;
}

interface MobilityStationsRequest {
  eventId?: unknown;
  stations?: unknown;
}

@ApiTags('mobility')
@Controller('mobility/stations')
export class MobilityStationsController {
  constructor(
    private readonly mobilityStationsService: MobilityStationsService,
    private readonly mobilityStationRepository: MobilityStationRepository,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener estaciones de movilidad guardadas desde la BD',
    description:
      'Devuelve todas las estaciones de movilidad guardadas en la base de datos. Puede limitar la cantidad con el parámetro limit.',
  })
  @ApiResponse({ status: 200, description: 'Lista de estaciones devuelta' })
  @ApiResponse({
    status: 404,
    description: 'No hay estaciones guardadas en la base de datos',
  })
  async get(@Query('limit') limit?: string) {
    let limitNumber: number | undefined = undefined;
    if (limit) {
      limitNumber = parseInt(limit, 10);
      if (isNaN(limitNumber) || limitNumber < 1) {
        throw new BadRequestException('limit debe ser un número positivo.');
      }
    }
    const stations =
      await this.mobilityStationRepository.getLatestStations(limitNumber);
    return stations;
  }

  @Post('event')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Agregar estaciones a un evento',
    description:
      'Recibe un eventId y un array de estaciones. Agrega las estaciones al evento especificado.',
  })
  @ApiResponse({
    status: 201,
    description: 'Estaciones agregadas al evento correctamente',
  })
  async addStationsToEvent(@Body() body: AddStationsToEventRequest) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('El cuerpo de la petición es requerido.');
    }

    const eventId = this.parseEventId(body.eventId);
    const stations = this.parseStationsArray(body.stations);

    await this.mobilityStationRepository.addStationsToEvent(eventId, stations);

    return {
      status: 'created',
      eventId,
      totalStations: stations.length,
    };
  }

  @Put('update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar una estación en todos los eventos',
    description:
      'Recibe una estación con _id y actualiza esa estación en todos los eventos donde aparezca.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estación actualizada en todos los eventos',
  })
  async updateStationInAllEvents(@Body() body: UpdateStationRequest) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('El cuerpo de la petición es requerido.');
    }

    if (!body.station) {
      throw new BadRequestException('station es obligatorio.');
    }

    const station = this.parseStation(body.station, 0);

    if (!station._id) {
      throw new BadRequestException(
        'La estación debe tener un _id para actualizarla.',
      );
    }

    const result =
      await this.mobilityStationRepository.updateStationInAllEvents(station);

    return {
      status: 'updated',
      updatedCount: result.updatedCount,
      matchedCount: result.matchedCount,
    };
  }

  @Get(':eventId')
  @ApiOperation({
    summary: 'Obtener estaciones de movilidad por evento ID',
    description:
      'Devuelve todas las estaciones de movilidad para un evento específico.',
  })
  @ApiResponse({ status: 200, description: 'Estaciones del evento' })
  @ApiResponse({
    status: 404,
    description: 'No hay estaciones para este evento',
  })
  async getByEventId(@Param('eventId') eventId: string) {
    const stations =
      await this.mobilityStationRepository.getLatestStationsByEventId(eventId);
    return stations;
  }

  @Post('mock')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary:
      'Publicar un mensaje mock en la cola movilidad.estaciones.festivalverde',
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

    const message = await this.mobilityStationsService.publishStations(
      eventId,
      stations,
      mode,
    );

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
      throw new BadRequestException(
        'eventId es obligatorio y debe ser una cadena.',
      );
    }
    return eventId.trim();
  }

  private parseStationsArray(rawStations: unknown): MobilityStation[] {
    if (!rawStations) {
      throw new BadRequestException('stations es obligatorio.');
    }

    if (!Array.isArray(rawStations)) {
      throw new BadRequestException('stations debe ser un array.');
    }

    if (rawStations.length === 0) {
      throw new BadRequestException(
        'stations debe contener al menos una estación.',
      );
    }

    return rawStations.map(
      (station, index) => this.parseStation(station, index, true), // Permitir _id si viene
    );
  }

  private parseStations(rawStations: unknown): {
    stations: MobilityStation[];
    mode: 'bulk' | 'update';
  } {
    if (!rawStations) {
      throw new BadRequestException('stations es obligatorio.');
    }

    const isArray = Array.isArray(rawStations);
    const candidateStations = (
      isArray ? rawStations : [rawStations]
    ) as unknown[];

    if (candidateStations.length === 0) {
      throw new BadRequestException(
        'stations debe contener al menos una estación.',
      );
    }

    const stations = candidateStations.map((station, index) =>
      this.parseStation(station, index),
    );

    return {
      stations,
      mode: isArray ? 'bulk' : 'update',
    };
  }

  private parseStation(
    station: unknown,
    index: number,
    allowId: boolean = true,
  ): MobilityStation {
    if (!station || typeof station !== 'object') {
      throw new BadRequestException(
        `stations[${index}] debe ser un objeto con los datos de la estación.`,
      );
    }

    const {
      _id,
      name,
      location,
      capacity,
      bikesCount,
      status,
      createdAt,
      updatedAt,
    } = station as Record<string, unknown>;

    // Validar _id si está presente
    if (_id !== undefined) {
      if (!allowId) {
        throw new BadRequestException(
          `_id no está permitido al agregar estaciones a un evento en stations[${index}].`,
        );
      }
      if (typeof _id !== 'string') {
        throw new BadRequestException(
          `_id inválido en stations[${index}]. Debe ser una cadena.`,
        );
      }
    }

    // Validar name
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new BadRequestException(
        `name inválido en stations[${index}]. Debe ser una cadena no vacía.`,
      );
    }

    // Validar location
    if (!location || typeof location !== 'object') {
      throw new BadRequestException(
        `location inválido en stations[${index}]. Debe ser un objeto con type y coordinates.`,
      );
    }

    const locationObj = location as Record<string, unknown>;
    const locationType = locationObj.type;
    const coordinates = locationObj.coordinates;

    if (typeof locationType !== 'string' || locationType !== 'Point') {
      throw new BadRequestException(
        `location.type inválido en stations[${index}]. Debe ser "Point".`,
      );
    }

    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      throw new BadRequestException(
        `location.coordinates inválido en stations[${index}]. Debe ser un array [lng, lat].`,
      );
    }

    const [lng, lat] = coordinates;
    const parsedLng = this.parseNumber(
      lng,
      `location.coordinates[0] (lng) inválido en stations[${index}].`,
    );
    const parsedLat = this.parseNumber(
      lat,
      `location.coordinates[1] (lat) inválido en stations[${index}].`,
    );

    // Validar capacity
    const parsedCapacity = this.parseNumber(
      capacity,
      `capacity inválido en stations[${index}].`,
    );

    // Validar bikesCount
    const parsedBikesCount = this.parseNumber(
      bikesCount,
      `bikesCount inválido en stations[${index}].`,
    );

    // Validar status
    if (typeof status !== 'string' || status.trim().length === 0) {
      throw new BadRequestException(
        `status inválido en stations[${index}]. Debe ser una cadena no vacía.`,
      );
    }

    const parsedStation: MobilityStation = {
      ...(_id && { _id: _id.trim() }),
      name: name.trim(),
      location: {
        type: locationType,
        coordinates: [parsedLng, parsedLat],
      },
      capacity: parsedCapacity,
      bikesCount: parsedBikesCount,
      status: status.trim(),
    };

    // Agregar createdAt y updatedAt si vienen (opcionales)
    if (createdAt !== undefined) {
      if (createdAt instanceof Date) {
        parsedStation.createdAt = createdAt;
      } else if (typeof createdAt === 'string') {
        parsedStation.createdAt = new Date(createdAt);
      }
    }

    if (updatedAt !== undefined) {
      if (updatedAt instanceof Date) {
        parsedStation.updatedAt = updatedAt;
      } else if (typeof updatedAt === 'string') {
        parsedStation.updatedAt = new Date(updatedAt);
      }
    }

    return parsedStation;
  }

  private parseNumber(value: unknown, errorMessage: string): number {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      throw new BadRequestException(errorMessage);
    }
    return parsed;
  }
}
