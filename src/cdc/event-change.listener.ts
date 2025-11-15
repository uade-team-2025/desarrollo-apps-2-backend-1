import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel, ChannelModel, connect, ConsumeMessage } from 'amqplib';
import {
  EventChangeHandler,
  EventChangeMessage,
} from './interfaces/event-change-handler.interface';

export const EVENT_CHANGE_HANDLERS = 'EVENT_CHANGE_HANDLERS';

@Injectable()
export class EventChangeListenerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(EventChangeListenerService.name);
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private readonly exchangeName = 'citypass_def';
  private readonly queueName = 'cultura.events.modificar';
  private readonly routingKey = 'cultura.events.modificar';

  constructor(
    private readonly configService: ConfigService,
    @Inject(EVENT_CHANGE_HANDLERS)
    private readonly handlers: EventChangeHandler[],
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.connect();
    } catch (error) {
      this.logger.error(
        'No se pudo iniciar el listener de cambios de eventos:',
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
      `Conectando listener de cambios de eventos a RabbitMQ: ${url.replace(/:[^:@]+@/, ':****@')}`,
    );

    const connection = await connect(url);
    const channel = await connection.createChannel();

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

    connection.on('close', () => {
      this.connection = null;
      this.channel = null;
    });

    this.connection = connection;
    this.channel = channel;

    this.logger.log(
      `Listener de cambios de eventos suscripto a ${this.exchangeName}:${this.routingKey}`,
    );
  }

  private async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
    } catch (error) {
      this.logger.error(
        'Error cerrando la conexión del listener de eventos:',
        error,
      );
    } finally {
      this.channel = null;
      this.connection = null;
    }
  }

  private async handleMessage(message: ConsumeMessage | null): Promise<void> {
    if (!message) {
      return;
    }

    try {
      const parsed: EventChangeMessage = JSON.parse(message.content.toString());
      const handler = this.handlers.find((h) => h.canHandle(parsed));

      if (!handler) {
        this.logger.debug(
          'Mensaje de evento sin handler asociado. Se confirma.',
        );
        this.channel?.ack(message);
        return;
      }

      await handler.handle(parsed);
      this.channel?.ack(message);
    } catch (error) {
      this.logger.error('Error procesando mensaje de cambio de evento:', error);
      this.channel?.nack(message, false, false);
    }
  }
}
