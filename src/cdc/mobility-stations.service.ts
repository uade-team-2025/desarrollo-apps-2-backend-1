import { Injectable, Logger } from '@nestjs/common';
import {
  MobilityStation,
  MobilityStationsMessage,
} from './interfaces/mobility-stations-message.interface';
import { RabbitMqPublisherService } from './rabbitmq-publisher.service';

@Injectable()
export class MobilityStationsService {
  private readonly logger = new Logger(MobilityStationsService.name);

  constructor(
    private readonly rabbitMqPublisherService: RabbitMqPublisherService,
  ) {}

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
      `Mensaje de movilidad publicado - Event ID: ${eventId}, Modo: ${mode}`,
    );

    return message;
  }
}
