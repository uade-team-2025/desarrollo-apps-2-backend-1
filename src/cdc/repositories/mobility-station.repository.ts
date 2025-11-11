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
            stationId: station.stationId,
          },
          {
            $set: {
              eventId: message.eventId,
              stationId: station.stationId,
              lt: station.lt,
              lg: station.lg,
              count: station.count,
              mode: message.metadata.mode,
              sentAt: new Date(message.metadata.sentAt),
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
      stationId: rec.stationId,
      lt: rec.lt,
      lg: rec.lg,
      count: rec.count,
    }));
  }

  async getLatestStations(limit: number = 10): Promise<MobilityStation[]> {
    const records = await this.model
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return records;
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
