import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMqPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqPublisherService.name);
  private connection: any = null;
  private channel: any = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      const url = this.configService.get<string>('RABBITMQ_URL', 'amqp://localhost:5672');
      this.logger.log(`Conectando a RabbitMQ: ${url.replace(/:[^:@]+@/, ':****@')}`);
      
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      
      // Declarar exchanges por dominio
      await this.channel.assertExchange('cultura.evento', 'topic', { durable: true });
      await this.channel.assertExchange('cultura.espacio', 'topic', { durable: true });
      await this.channel.assertExchange('cultura.ticket', 'topic', { durable: true });

      // Crear colas por tipo de cambio identificado (crear/modificar)
      await this.channel.assertQueue('cultura.evento.crear', { durable: true });
      await this.channel.assertQueue('cultura.evento.modificar', { durable: true });
      await this.channel.assertQueue('cultura.espacio.crear', { durable: true });
      await this.channel.assertQueue('cultura.espacio.modificar', { durable: true });
      await this.channel.assertQueue('cultura.ticket.crear', { durable: true });
      await this.channel.assertQueue('cultura.ticket.modificar', { durable: true });

      // Vincular colas a exchanges según routing key
      await this.channel.bindQueue('cultura.evento.crear', 'cultura.evento', 'crear');
      await this.channel.bindQueue('cultura.evento.modificar', 'cultura.evento', 'modificar');
      await this.channel.bindQueue('cultura.espacio.crear', 'cultura.espacio', 'crear');
      await this.channel.bindQueue('cultura.espacio.modificar', 'cultura.espacio', 'modificar');
      await this.channel.bindQueue('cultura.ticket.crear', 'cultura.ticket', 'crear');
      await this.channel.bindQueue('cultura.ticket.modificar', 'cultura.ticket', 'modificar');

      this.logger.log('RabbitMQ Publisher conectado exitosamente - Exchanges y colas (crear/modificar) registrados');
    } catch (error) {
      this.logger.error('Error conectando a RabbitMQ - CDC no estará disponible:', error.message);
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

      const exchangeMap: Record<string, string> = {
        events: 'cultura.evento',
        culturalplaces: 'cultura.espacio',
        tickets: 'cultura.ticket',
      };

      const routingKeyMap: Record<string, string> = {
        INSERT: 'crear',
        UPDATE: 'modificar',
        REPLACE: 'modificar',
        DELETE: 'modificar',
      };

      const exchange = exchangeMap[collection] ?? `cultura.${collection}`;
      const routingKey = routingKeyMap[event.eventType] ?? 'modificar';
      const message = JSON.stringify(event);

      this.channel.publish(exchange, routingKey, Buffer.from(message), {
        persistent: true,
      });
      
      this.logger.debug(
        `Evento publicado a tópico: ${exchange} (${routingKey}) - ${event.documentId} - mensaje: ${message}`,
      );
    } catch (error) {
      this.logger.error(`Error publicando a RabbitMQ:`, error);
      throw error;
    }
  }
}

