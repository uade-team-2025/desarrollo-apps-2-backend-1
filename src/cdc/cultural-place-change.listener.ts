import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import { CulturalPlaceChangeHandler } from './interfaces/cultural-place-change-handler.interface';
import { CulturalPlaceChangeMessage } from './interfaces/cultural-place-change-message.interface';

export const CULTURAL_PLACE_CHANGE_HANDLERS = 'CULTURAL_PLACE_CHANGE_HANDLERS';

@Injectable()
export class CulturalPlaceChangeListenerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(CulturalPlaceChangeListenerService.name);
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private readonly exchangeName = 'citypass_def';
  private readonly queueName = 'cultura.culturalplaces.modificar';
  private readonly routingKey = 'cultura.culturalplaces.modificar';

  constructor(
    private readonly configService: ConfigService,
    @Inject(CULTURAL_PLACE_CHANGE_HANDLERS)
    private readonly handlers: CulturalPlaceChangeHandler[],
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.connect();
    } catch (error) {
      this.logger.error(
        'No se pudo iniciar el listener de cambios de lugares culturales:',
        error,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  private async connect(): Promise<void> {
    const url = this.configService.get<string>(
      'RABBITMQ_URL',
      'amqp://localhost:5672',
    );
    this.logger.log(
      `Conectando listener de lugares culturales a RabbitMQ: ${url.replace(/:[^:@]+@/, ':****@')}`,
    );

    const connection = await amqp.connect(url);
    this.connection = connection;

    const channel = (await connection.createChannel()) as Channel;
    this.channel = channel;

    await channel.assertExchange(this.exchangeName, 'topic', { durable: true });
    await channel.assertQueue(this.queueName, { durable: true });
    await channel.bindQueue(this.queueName, this.exchangeName, this.routingKey);

    // Configurar prefetch para procesar un mensaje a la vez
    await channel.prefetch(1);

    const consumerOk = await channel.consume(
      this.queueName,
      (msg) => {
        if (msg) {
          this.handleMessage(msg);
        }
      },
      {
        noAck: false,
      },
    );

    this.logger.log(
      `Listener suscripto a ${this.exchangeName}:${this.routingKey}`,
    );
  }

  private async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      this.logger.log(
        'Listener de lugares culturales desconectado de RabbitMQ',
      );
    } catch (error) {
      this.logger.error(
        'Error cerrando la conexión de RabbitMQ para el listener de lugares culturales:',
        error,
      );
    }
  }

  private async handleMessage(message: ConsumeMessage | null): Promise<void> {
    if (!message) {
      return;
    }

    try {
      const parsed: CulturalPlaceChangeMessage = JSON.parse(
        message.content.toString(),
      );

      const handler = this.handlers.find((h) => h.canHandle(parsed));

      if (!handler) {
        this.logger.debug(
          'Mensaje de lugar cultural sin handler asociado. Se confirma.',
        );
        this.channel?.ack(message);
        return;
      }

      await handler.handle(parsed);
      this.channel?.ack(message);
    } catch (error) {
      this.logger.error(
        'Error procesando mensaje de lugar cultural. Se descarta.',
        error,
      );
      this.channel?.nack(message, false, false);
    }
  }
}
