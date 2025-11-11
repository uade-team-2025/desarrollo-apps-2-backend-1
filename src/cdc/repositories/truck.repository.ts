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
        `Procesando posición del camión: ${message.truckId} para evento: ${message.eventId}`,
      );

      await this.model.updateOne(
        {
          eventId: message.eventId,
          truckId: message.truckId,
        },
        {
          $set: {
            eventId: message.eventId,
            truckId: message.truckId,
            lat: message.position.lat,
            long: message.position.long,
          },
        },
        { upsert: true },
      );

      this.logger.log(
        `✓ Posición del camión guardada en BD (evento: ${message.eventId}, camión: ${message.truckId})`,
      );
    } catch (error) {
      this.logger.error(
        `Error guardando posición del camión en BD: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getLatestTrucksByEventId(eventId: string): Promise<any[]> {
    try {
      const records = await this.model
        .find({ eventId })
        .sort({ updatedAt: -1 })
        .lean()
        .exec();

      return records;
    } catch (error) {
      this.logger.error(
        `Error obteniendo camiones del evento ${eventId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getLatestTrucks(limit: number = 50): Promise<any[]> {
    try {
      const records = await this.model
        .find()
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean()
        .exec();

      return records;
    } catch (error) {
      this.logger.error(
        `Error obteniendo últimos camiones: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
