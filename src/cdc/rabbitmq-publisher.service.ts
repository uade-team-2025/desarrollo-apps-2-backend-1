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
      
      // Declarar un exchange por cada entidad
      await this.channel.assertExchange('mongodb.events.changes', 'topic', { durable: true });
      await this.channel.assertExchange('mongodb.culturalplaces.changes', 'topic', { durable: true });
      await this.channel.assertExchange('mongodb.tickets.changes', 'topic', { durable: true });
      
      this.logger.log('RabbitMQ Publisher conectado exitosamente');
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

      // Usar un exchange/tópico por cada entidad
      const exchange = `mongodb.${collection}.changes`;
      const message = JSON.stringify(event);
      
      this.channel.publish(exchange, '', Buffer.from(message), {
        persistent: true,
      });
      
      this.logger.debug(`Evento publicado a tópico: ${exchange} - ${event.documentId}`);
    } catch (error) {
      this.logger.error(`Error publicando a RabbitMQ:`, error);
      throw error;
    }
  }
}

