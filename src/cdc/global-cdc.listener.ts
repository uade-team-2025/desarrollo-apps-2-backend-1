import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel, ChannelModel, ConsumeMessage, connect } from 'amqplib';
import { MobilityStationsMessage } from './interfaces/mobility-stations-message.interface';
import { TruckMessage } from './interfaces/truck-message.interface';
import { MobilityStationRepository } from './repositories/mobility-station.repository';
import { TruckRepository } from './repositories/truck.repository';

type MessageHandler = (message: ConsumeMessage) => Promise<void> | void;

@Injectable()
export class GlobalCDCListenerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(GlobalCDCListenerService.name);
  private readonly exchange = 'citypass_def';
  private readonly queueName = 'cultura_def';
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  // Mapa de routing keys a sus handlers
  private readonly routingKeyHandlers: Map<string, MessageHandler> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly truckRepository: TruckRepository,
    private readonly mobilityStationRepository: MobilityStationRepository,
  ) {
    // Registrar handlers para cada routing key
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // Handler para camiones de residuos
    this.routingKeyHandlers.set(
      'residuos.camion.festivalverde',
      this.handleTruckMessage.bind(this),
    );

    // Handler para estaciones de bicicletas
    this.routingKeyHandlers.set(
      'movilidad.estacion.bicing',
      this.handleBikeStationMessage.bind(this),
    );

    // Aquí puedes agregar más handlers para otras routing keys
    // this.routingKeyHandlers.set(
    //   'cultura.evento.festivalverde',
    //   this.handleEventMessage.bind(this),
    // );
  }

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
      `Conectando listener global a RabbitMQ: ${url.replace(/:[^:@]+@/, ':****@')}`,
    );

    const connection = await connect(url);
    const channel = await connection.createChannel();

    await channel.checkQueue(this.queueName);

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

    const registeredKeys = Array.from(this.routingKeyHandlers.keys()).join(', ');
    this.logger.log(
      `Listener global iniciado - Exchange: '${this.exchange}', Cola: '${this.queueName}', Consumer Tag: '${consumerOk.consumerTag}', Routing Keys registradas: [${registeredKeys}]`,
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
        'Error cerrando la conexión del listener global:',
        error,
      );
    } finally {
      this.channel = null;
      this.connection = null;
    }
  }

  /**
   * Dispatcher global de mensajes que delega al handler apropiado según la routing key
   */
  private handleMessage(message: ConsumeMessage | null): void {
    if (!message) {
      this.logger.warn('Mensaje nulo recibido en el listener global');
      return;
    }

    const routingKey = message.fields.routingKey;
    const handler = this.routingKeyHandlers.get(routingKey);

    if (!handler) {
      this.logger.debug(
        `Mensaje ignorado - No hay handler registrado para routing key: '${routingKey}'`,
      );
      // Hacer ACK para que no se reintente el mensaje
      this.channel?.ack(message);
      return;
    }

    this.logger.log(`Procesando mensaje con routing key: '${routingKey}'`);

    try {
      const result = handler(message);

      // Si el handler retorna una promesa, esperarla
      if (result instanceof Promise) {
        result.catch((error) => {
          this.logger.error(
            `Error en handler asíncrono para '${routingKey}': ${error.message}`,
            error.stack,
          );
          this.channel?.nack(message, false, false);
        });
      }
    } catch (error) {
      this.logger.error(
        `Error ejecutando handler para '${routingKey}': ${error.message}`,
        error.stack,
      );
      this.channel?.nack(message, false, false);
    }
  }

  /**
   * Handler específico para mensajes de camiones de residuos
   */
  private async handleTruckMessage(message: ConsumeMessage): Promise<void> {
    try {
      const content = message.content.toString();
      const parsed: TruckMessage = JSON.parse(content);

      this.logger.log(
        `TRUCK Mensaje recibido - Event ID: ${parsed.eventId}, Camión: ${parsed.truckId}, Posición: (${parsed.position.lat}, ${parsed.position.long})`,
      );

      // Persistir en la BD
      await this.truckRepository.saveTruckMessage(parsed);

      this.logger.log(
        `✓ Camión procesado y guardado en BD (evento: ${parsed.eventId}, camión: ${parsed.truckId})`,
      );

      this.channel?.ack(message);
    } catch (error) {
      this.logger.error(
        `Error procesando mensaje de camión: ${error.message}`,
        error.stack,
      );
      this.channel?.nack(message, false, false);
    }
  }

  /**
   * Handler específico para mensajes de estaciones de bicicletas
   */
  private async handleBikeStationMessage(
    message: ConsumeMessage,
  ): Promise<void> {
    try {
      const content = message.content.toString();
      const parsed: MobilityStationsMessage = JSON.parse(content);

      this.logger.log(
        `BIKE STATIONS mensaje recibido - Event ID: ${parsed.eventId}, Estaciones: ${parsed.stations.length}, Mode: ${parsed.metadata.mode}`,
      );

      // Persistir en la BD
      await this.mobilityStationRepository.saveMobilityStationsMessage(parsed);

      this.logger.log(
        `✓ ${parsed.stations.length} estaciones procesadas y guardadas en BD (evento: ${parsed.eventId})`,
      );

      this.channel?.ack(message);
    } catch (error) {
      this.logger.error(
        `Error procesando estaciones de bicicletas: ${error.message}`,
        error.stack,
      );
      this.channel?.nack(message, false, false);
    }
  }

  // Ejemplos de otros handlers que puedes implementar:

  // private async handleEventMessage(message: ConsumeMessage): Promise<void> {
  //   try {
  //     const content = message.content.toString();
  //     const parsed = JSON.parse(content);
  //
  //     this.logger.log(`EVENT mensaje recibido: ${parsed.eventId}`);
  //
  //     // Lógica para procesar eventos culturales
  //
  //     this.channel?.ack(message);
  //   } catch (error) {
  //     this.logger.error(`Error procesando evento: ${error.message}`);
  //     this.channel?.nack(message, false, false);
  //   }
  // }
}
