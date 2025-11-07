import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { RabbitMqPublisherService } from './rabbitmq-publisher.service';

@Injectable()
export class ChangeStreamsListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChangeStreamsListenerService.name);
  private streams: any[] = [];

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly rabbitMqPublisher: RabbitMqPublisherService,
  ) {}

  async onModuleInit() {
    this.logger.log('Iniciando Change Streams Listeners...');
    
    const collections = [
      { name: 'events', schemaName: 'Event' },
      { name: 'culturalplaces', schemaName: 'CulturalPlace' },
      { name: 'tickets', schemaName: 'Ticket' },
    ];

    for (const collection of collections) {
      try {
        await this.startListening(collection.name, collection.schemaName);
      } catch (error) {
        this.logger.error(`Error iniciando listener para ${collection.name}:`, error);
      }
    }
  }

  async onModuleDestroy() {
    for (const stream of this.streams) {
      try {
        await stream.close();
      } catch (error) {
        this.logger.error('Error cerrando stream:', error);
      }
    }
    this.streams = [];
  }

  private async startListening(collectionName: string, schemaName: string): Promise<void> {
    const model = this.connection.models[schemaName];
    if (!model) {
      this.logger.warn(`Modelo ${schemaName} no encontrado`);
      return;
    }

    const stream = model.watch([], {
      fullDocument: 'updateLookup',
    });

    stream.on('change', async (change: any) => {
      await this.handleChange(change, collectionName);
    });

    stream.on('error', (error: Error) => {
      this.logger.error(`Error en Change Stream de ${collectionName}:`, error);
    });

    this.streams.push(stream);
    this.logger.log(`Change Stream iniciado para: ${collectionName}`);
  }

  private async handleChange(change: any, collectionName: string): Promise<void> {
    try {
      const documentId = change.documentKey?._id?.toString();
      if (!documentId) {
        this.logger.warn('Document ID no encontrado en el cambio');
        return;
      }

      if (change.operationType === 'delete') {
        const event = {
          eventType: this.mapOperationType(change.operationType),
          collection: collectionName,
          documentId,
          timestamp: new Date().toISOString(),
          data: change.documentKey,
        };
        await this.rabbitMqPublisher.publish(collectionName, event);
        return;
      }

      const populatedDocument = await this.getPopulatedDocument(collectionName, documentId);
      
      const event = {
        eventType: this.mapOperationType(change.operationType),
        collection: collectionName,
        documentId,
        timestamp: new Date().toISOString(),
        data: populatedDocument || change.fullDocument,
      };

      await this.rabbitMqPublisher.publish(collectionName, event);
    } catch (error) {
      this.logger.error(`Error procesando cambio para ${collectionName}:`, error);
    }
  }

  private async getPopulatedDocument(collectionName: string, documentId: string): Promise<any> {
    const model = this.connection.models[this.getSchemaName(collectionName)];
    if (!model) {
      return null;
    }

    let query = model.findById(documentId);

    switch (collectionName) {
      case 'events':
        query = query.populate('culturalPlaceId', 'name description category characteristics contact image rating');
        break;

      case 'tickets':
        query = query.populate({
          path: 'eventId',
          select: '_id name description date time image',
          populate: {
            path: 'culturalPlaceId',
            select: 'name description category characteristics contact image rating',
          },
        });
        break;

      case 'culturalplaces':
        // No necesitan populate, es colección independiente
        break;
    }

    const doc = await query.exec();
    
    // Convertir a objeto plano si es necesario
    if (doc && typeof doc.toObject === 'function') {
      return doc.toObject();
    }
    
    return doc;
  }

  private getSchemaName(collectionName: string): string {
    const mapping: Record<string, string> = {
      events: 'Event',
      culturalplaces: 'CulturalPlace',
      tickets: 'Ticket',
    };
    return mapping[collectionName] || collectionName;
  }

  private mapOperationType(operationType: string): string {
    const mapping: Record<string, string> = {
      insert: 'INSERT',
      update: 'UPDATE',
      replace: 'REPLACE',
      delete: 'DELETE',
    };
    return mapping[operationType] || operationType.toUpperCase();
  }
}

