import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TruckMessage } from '../interfaces/truck-message.interface';
import { TruckDocument, TruckRecord } from '../schemas/truck.schema';

@Injectable()
export class TruckRepository {
  private readonly logger = new Logger(TruckRepository.name);

  constructor(
    @InjectModel(TruckRecord.name)
    private model: Model<TruckDocument>,
  ) {}

  async saveTruckMessage(message: TruckMessage): Promise<void> {
    try {
      this.logger.log(
        `Procesando ruta: ${message.id_ruta} (punto ${message.indice_punto_actual}/${message.total_puntos}, ${message.porcentaje_progreso}%)`,
      );

      const result = await this.model.updateOne(
        {
          id_ruta: message.id_ruta,
        },
        {
          $set: {
            id_ruta: message.id_ruta,
            indice_punto_actual: message.indice_punto_actual,
            total_puntos: message.total_puntos,
            punto_actual: {
              latitud: message.punto_actual.latitud,
              longitud: message.punto_actual.longitud,
            },
            porcentaje_progreso: message.porcentaje_progreso,
            informacion_adicional: message.informacion_adicional,
          },
        },
        { upsert: true },
      );

      const action = result.upsertedCount > 0 ? 'creada' : 'actualizada';
      this.logger.log(`✓ Ruta ${action} en BD (id_ruta: ${message.id_ruta})`);
    } catch (error) {
      this.logger.error(
        `Error guardando ruta en BD: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getLatestTrucksByEventId(eventId: string): Promise<any[]> {
    try {
      const records = await this.model
        .find({ 'informacion_adicional.id_evento': eventId })
        .sort({ updatedAt: -1 })
        .lean()
        .exec();

      return records;
    } catch (error) {
      this.logger.error(
        `Error obteniendo rutas del evento ${eventId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getLatestTrucks(limit?: number): Promise<any[]> {
    try {
      const query = this.model.find().sort({ updatedAt: -1 });

      if (limit && limit > 0) {
        query.limit(limit);
      }

      const records = await query.lean().exec();

      return records;
    } catch (error) {
      this.logger.error(
        `Error obteniendo últimos camiones: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getTruckByIdRuta(idRuta: string): Promise<any> {
    try {
      const record = await this.model
        .findOne({ id_ruta: idRuta })
        .lean()
        .exec();

      if (!record) {
        throw new Error(`No se encontró la ruta con id_ruta: ${idRuta}`);
      }

      return record;
    } catch (error) {
      this.logger.error(
        `Error obteniendo ruta por id_ruta ${idRuta}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
