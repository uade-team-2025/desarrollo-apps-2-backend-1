import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel, ChannelModel, ConsumeMessage, connect } from 'amqplib';

@Injectable()
export class MobilityStationsListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MobilityStationsListenerService.name);
  private readonly queueName = 'movilidad.estaciones.festivalverde';
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.connect();
    } catch (error) {
      this.logger.error('No se pudo iniciar el listener de movilidad:', error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  private async connect(): Promise<void> {
    const url = this.configService.get<string>('RABBITMQ_URL', 'amqp://localhost:5672');
    this.logger.log(
      `Conectando listener de movilidad a RabbitMQ: ${url.replace(/:[^:@]+@/, ':****@')}`,
    );

    const connection = await connect(url);
    const channel = await connection.createChannel();

    await channel.assertQueue(this.queueName, { durable: true });

    await channel.consume(this.queueName, (msg) => this.handleMessage(msg), {
      noAck: false,
    });

    connection.on('close', () => {
      this.connection = null;
      this.channel = null;
    });

    this.connection = connection;
    this.channel = channel;

    this.logger.log(`Listener de movilidad suscripto a la cola ${this.queueName}`);
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
      this.logger.error('Error cerrando la conexión del listener de movilidad:', error);
    } finally {
      this.channel = null;
      this.connection = null;
    }
  }

  private handleMessage(message: ConsumeMessage | null): void {
    if (!message) {
      return;
    }

    try {
      const content = message.content.toString();
      const parsed = JSON.parse(content);

      this.logger.log(
        `Mensaje recibido en ${this.queueName}: ${JSON.stringify(parsed, null, 2)}`,
      );

      this.channel?.ack(message);
    } catch (error) {
      this.logger.error('Error procesando mensaje de movilidad:', error);
      this.channel?.nack(message, false, false);
    }
  }
}

