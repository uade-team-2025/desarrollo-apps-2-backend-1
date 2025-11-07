import { Injectable, Logger } from '@nestjs/common';
import { RabbitMqPublisherService } from './rabbitmq-publisher.service';
import {
  MobilityStation,
  MobilityStationsMessage,
} from './interfaces/mobility-stations-message.interface';

@Injectable()
export class MobilityStationsService {
  private readonly logger = new Logger(MobilityStationsService.name);

  constructor(private readonly rabbitMqPublisherService: RabbitMqPublisherService) {}

  async publishStations(
    eventId: string,
    stations: MobilityStation[],
    mode: 'bulk' | 'update',
  ): Promise<MobilityStationsMessage> {
    const message: MobilityStationsMessage = {
      eventId,
      stations,
      metadata: {
        mode,
        sentAt: new Date().toISOString(),
        totalStations: stations.length,
      },
    };

    await this.rabbitMqPublisherService.sendMobilityStationsMessage(message);

    this.logger.log(
      `Mensaje mock enviado a ${this.constructor.name} -> cola movilidad.estaciones.festivalverde (${mode})`,
    );

    return message;
  }
}

