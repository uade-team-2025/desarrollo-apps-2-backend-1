import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  MobilityStation,
  MobilityStationsMessage,
} from '../interfaces/mobility-stations-message.interface';
import {
  MobilityStationDocument,
  MobilityStationRecord,
} from '../schemas/mobility-station.schema';

@Injectable()
export class MobilityStationRepository {
  private readonly logger = new Logger(MobilityStationRepository.name);

  constructor(
    @InjectModel(MobilityStationRecord.name)
    private model: Model<MobilityStationDocument>,
  ) {}

  async saveMobilityStationsMessage(
    message: MobilityStationsMessage,
  ): Promise<void> {
    try {
      this.logger.log(
        `Procesando ${message.stations.length} estaciones para evento: ${message.eventId}`,
      );

      const upsertPromises = message.stations.map((station) => {
        return this.model.updateOne(
          {
            eventId: message.eventId,
            name: station.name,
          },
          {
            $set: {
              eventId: message.eventId,
              name: station.name,
              location: {
                type: station.location.type || 'Point',
                coordinates: station.location.coordinates,
              },
              capacity: station.capacity,
              bikesCount: station.bikesCount,
              status: station.status,
            },
          },
          { upsert: true },
        );
      });

      if (upsertPromises.length > 0) {
        const results = await Promise.all(upsertPromises);
        this.logger.log(
          `✓ ${results.length} estaciones procesadas y guardadas en BD`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error guardando estaciones en BD: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async addStationsToEvent(
    eventId: string,
    stations: MobilityStation[],
  ): Promise<void> {
    try {
      this.logger.log(
        `Agregando ${stations.length} estaciones al evento: ${eventId}`,
      );

      const upsertPromises = stations.map((station) => {
        // Si viene _id, buscar por _id; si no, buscar por eventId + name
        const filter = station._id
          ? { _id: station._id }
          : { eventId, name: station.name };

        const updateData: any = {
          eventId,
          name: station.name,
          location: {
            type: station.location.type || 'Point',
            coordinates: station.location.coordinates,
          },
          capacity: station.capacity,
          bikesCount: station.bikesCount,
          status: station.status,
        };

        // Agregar createdAt y updatedAt si vienen
        if (station.createdAt) {
          updateData.createdAt = station.createdAt;
        }
        if (station.updatedAt) {
          updateData.updatedAt = station.updatedAt;
        }

        return this.model.updateOne(
          filter,
          { $set: updateData },
          { upsert: true },
        );
      });

      if (upsertPromises.length > 0) {
        const results = await Promise.all(upsertPromises);
        const createdCount = results.filter(
          (r) => r.upsertedCount && r.upsertedCount > 0,
        ).length;
        const updatedCount = results.filter(
          (r) => r.modifiedCount && r.modifiedCount > 0,
        ).length;

        this.logger.log(
          `✓ ${results.length} estaciones procesadas (${createdCount} creadas, ${updatedCount} actualizadas)`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error agregando estaciones al evento: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateStationInAllEvents(
    station: MobilityStation,
  ): Promise<{ matchedCount: number; updatedCount: number }> {
    if (!station._id) {
      throw new Error('La estación debe tener un _id para actualizarla.');
    }

    try {
      // Intentar obtener la estación original por _id para obtener el name original
      let originalStation = await this.model
        .findById(station._id)
        .lean()
        .exec();

      // Si no se encuentra por _id, buscar por el name actual (por si el _id cambió o no existe)
      if (!originalStation) {
        this.logger.warn(
          `No se encontró estación con _id: ${station._id}, buscando por name: ${station.name}`,
        );
        originalStation = await this.model
          .findOne({ name: station.name })
          .lean()
          .exec();

        if (!originalStation) {
          throw new Error(
            `No se encontró la estación con _id: ${station._id} ni con name: ${station.name}`,
          );
        }
      }

      // Actualizar todas las estaciones con el mismo name en todos los eventos
      // (una estación puede aparecer en múltiples eventos con el mismo name)
      const result = await this.model.updateMany(
        { name: originalStation.name },
        {
          $set: {
            name: station.name,
            location: {
              type: station.location.type || 'Point',
              coordinates: station.location.coordinates,
            },
            capacity: station.capacity,
            bikesCount: station.bikesCount,
            status: station.status,
          },
        },
      );

      this.logger.log(
        `✓ Estación "${station.name}" actualizada en ${result.modifiedCount} de ${result.matchedCount} eventos`,
      );

      return {
        matchedCount: result.matchedCount,
        updatedCount: result.modifiedCount,
      };
    } catch (error) {
      this.logger.error(
        `Error actualizando estación en todos los eventos: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getLatestStationsByEventId(
    eventId: string,
    limit: number = 10,
  ): Promise<MobilityStation[]> {
    const records = await this.model
      .find({ eventId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return records.map((rec: any) => ({
      _id: rec._id?.toString(),
      name: rec.name,
      location: {
        type: rec.location?.type || 'Point',
        coordinates: rec.location?.coordinates || [],
      },
      capacity: rec.capacity,
      bikesCount: rec.bikesCount,
      status: rec.status,
      createdAt: rec.createdAt,
      updatedAt: rec.updatedAt,
    }));
  }

  async getLatestStations(limit?: number): Promise<MobilityStation[]> {
    const query = this.model.find().sort({ createdAt: -1 });

    if (limit && limit > 0) {
      query.limit(limit);
    }

    const records = await query.lean().exec();

    return records.map((rec: any) => ({
      _id: rec._id?.toString(),
      name: rec.name,
      location: {
        type: rec.location?.type || 'Point',
        coordinates: rec.location?.coordinates || [],
      },
      capacity: rec.capacity,
      bikesCount: rec.bikesCount,
      status: rec.status,
      createdAt: rec.createdAt,
      updatedAt: rec.updatedAt,
    }));
  }

  async getLatestEvent(): Promise<string | null> {
    const record = await this.model
      .findOne()
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return record?.eventId || null;
  }
}
