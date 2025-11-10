import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel, ChannelModel, ConsumeMessage, connect } from 'amqplib';
import { TruckMessage } from './interfaces/truck-message.interface';
import { TruckRepository } from './repositories/truck.repository';

@Injectable()
export class ResiduosTruckListenerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ResiduosTruckListenerService.name);
  private readonly exchange = 'citypass_def';
  private readonly queueName = 'residuos.camion.festivalverde';
  private readonly routingKey = 'residuos.camion.festivalverde';
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly truckRepository: TruckRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.connect();
    } catch (error) {
      this.logger.error('No se pudo iniciar el listener de camiones:', error);
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
      `Conectando listener de camiones a RabbitMQ: ${url.replace(/:[^:@]+@/, ':****@')}`,
    );

    const connection = await connect(url);
    const channel = await connection.createChannel();

    // Asegurar que el exchange existe
    await channel.assertExchange(this.exchange, 'topic', { durable: true });

    // Declarar la cola
    await channel.assertQueue(this.queueName, { durable: true });

    // Bindar la cola al exchange con la routing key
    await channel.bindQueue(this.queueName, this.exchange, this.routingKey);

    // Configurar prefetch para procesar un mensaje a la vez
    await channel.prefetch(1);

    this.connection = connection;
    this.channel = channel;

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

    connection.on('error', (error) => {
      this.logger.error('Error en conexión de RabbitMQ:', error);
    });

    this.logger.log(
      `Listener de camiones iniciado - Exchange: '${this.exchange}', Routing Key: '${this.routingKey}', Cola: '${this.queueName}', Consumer Tag: '${consumerOk.consumerTag}'`,
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
        'Error cerrando la conexión del listener de camiones:',
        error,
      );
    } finally {
      this.channel = null;
      this.connection = null;
    }
  }

  private handleMessage(message: ConsumeMessage | null): void {
    if (!message) {
      this.logger.warn('Mensaje nulo recibido en el listener de camiones');
      return;
    }

    try {
      const content = message.content.toString();
      const parsed: TruckMessage = JSON.parse(content);

      this.logger.log(
        `Mensaje recibido - Event ID: ${parsed.eventId}, Camión: ${parsed.truckId}, Posición: (${parsed.position.lat}, ${parsed.position.long})`,
      );

      // Persistir en la BD
      this.truckRepository
        .saveTruckMessage(parsed)
        .then(() => {
          this.logger.log(
            `✓ Camión procesado y guardado en BD (evento: ${parsed.eventId}, camión: ${parsed.truckId})`,
          );
          this.channel?.ack(message);
        })
        .catch((error) => {
          this.logger.error(
            `Error persistiendo camión en BD: ${error.message}`,
            error.stack,
          );
          this.channel?.nack(message, false, false);
        });
    } catch (error) {
      this.logger.error(
        `Error procesando mensaje de camión: ${error.message}`,
        error.stack,
      );
      this.channel?.nack(message, false, false);
    }
  }
}
