import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { MobilityStationsMessage } from './interfaces/mobility-stations-message.interface';

@Injectable()
export class RabbitMqPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqPublisherService.name);
  private connection: any = null;
  private channel: any = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      const url = this.configService.get<string>(
        'RABBITMQ_URL',
        'amqp://localhost:5672',
      );
      this.logger.log(
        `Conectando a RabbitMQ: ${url.replace(/:[^:@]+@/, ':****@')}`,
      );

      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      // Asegurar que el exchange existe
      const exchange = 'citypass_def';
      // await this.channel.assertExchange(exchange, 'topic', { durable: true });

      // const queuesAndRoutingKeys = [
      //   { queue: 'cultura.evento.crear', routingKey: 'cultura.evento.crear' },
      //   {
      //     queue: 'cultura.evento.modificar',
      //     routingKey: 'cultura.evento.modificar',
      //   },
      //   { queue: 'cultura.espacio.crear', routingKey: 'cultura.espacio.crear' },
      //   {
      //     queue: 'cultura.espacio.modificar',
      //     routingKey: 'cultura.espacio.modificar',
      //   },
      //   { queue: 'cultura.ticket.crear', routingKey: 'cultura.ticket.crear' },
      //   {
      //     queue: 'cultura.ticket.modificar',
      //     routingKey: 'cultura.ticket.modificar',
      //   },
      //   {
      //     queue: 'movilidad.estaciones.festivalverde',
      //     routingKey: 'movilidad.estaciones.festivalverde',
      //   },
      //   {
      //     queue: 'residuos.camion.festivalverde',
      //     routingKey: 'residuos.camion.festivalverde',
      //   },
      // ];

      // for (const { queue, routingKey } of queuesAndRoutingKeys) {
      //   await this.channel.assertQueue(queue, { durable: true });
      //   await this.channel.bindQueue(queue, exchange, routingKey);
      // }

      this.logger.log(
        `RabbitMQ Publisher conectado exitosamente - Exchange '${exchange}' (topic) `,
      );
    } catch (error) {
      this.logger.error(
        'Error conectando a RabbitMQ - CDC no estará disponible:',
        error.message,
      );
      // No lanzar error para que la app siga funcionando aunque RabbitMQ no esté disponible
      // throw error;
    }
  }

  async onModuleDestroy() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      this.logger.log('RabbitMQ Publisher desconectado');
    } catch (error) {
      this.logger.error('Error desconectando RabbitMQ:', error);
    }
  }

  async publish(collection: string, event: any): Promise<void> {
    try {
      if (!this.channel) {
        throw new Error('RabbitMQ channel no está disponible');
      }

      const routingKeyMap: Record<string, string> = {
        INSERT: 'crear',
        UPDATE: 'modificar',
        REPLACE: 'modificar',
        DELETE: 'modificar',
      };

      const exchange = 'citypass_def';
      const operation = routingKeyMap[event.eventType] ?? 'modificar';
      const routingKey = `cultura.${collection}.${operation}`;
      const message = JSON.stringify(event);

      this.channel.publish(exchange, routingKey, Buffer.from(message), {
        persistent: true,
      });

      this.logger.debug(
        `Evento publicado al exchange '${exchange}' con routing key '${routingKey}' - ${event.documentId}`,
      );
    } catch (error) {
      this.logger.error(`Error publicando a RabbitMQ:`, error);
      throw error;
    }
  }

  async sendMobilityStationsMessage(
    message: MobilityStationsMessage,
  ): Promise<void> {
    try {
      if (!this.channel) {
        throw new Error('RabbitMQ channel no está disponible');
      }

      const exchange = 'citypass_def';
      const routingKey = 'movilidad.estaciones.festivalverde';
      const payload = JSON.stringify(message);

      this.channel.publish(exchange, routingKey, Buffer.from(payload), {
        persistent: true,
      });

      this.logger.debug(
        `Mensaje de movilidad publicado al exchange '${exchange}' con routing key '${routingKey}'`,
      );
    } catch (error) {
      this.logger.error(`Error enviando mensaje de movilidad:`, error);
      throw error;
    }
  }
}
