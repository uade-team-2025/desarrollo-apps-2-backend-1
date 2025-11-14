import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChangeStreamsListenerService } from './change-streams-listener.service';
import { CulturalPlaceActivationHandler } from './handlers/cultural-place-activation.handler';
import { CulturalPlaceClausureHandler } from './handlers/cultural-place-clausure.handler';
import { EventEmailNotificationHandler } from './handlers/event-email-notification.handler';
import { RabbitMqPublisherService } from './rabbitmq-publisher.service';
import { MobilityStationRepository } from './repositories/mobility-station.repository';
import { TruckRepository } from './repositories/truck.repository';
import { GlobalCDCListenerService } from './global-cdc.listener';
import { ResiduosTrucksController } from './residuos-trucks.controller';
import {
  MobilityStationRecord,
  MobilityStationSchema,
} from './schemas/mobility-station.schema';
import { TruckRecord, TruckSchema } from './schemas/truck.schema';

@Module({
  imports: [
    ConfigModule,
    EventsModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: MobilityStationRecord.name, schema: MobilityStationSchema },
      { name: TruckRecord.name, schema: TruckSchema },
    ]),
  ],
  controllers: [ResiduosTrucksController],
  providers: [
    RabbitMqPublisherService,
    ChangeStreamsListenerService,
    CulturalPlaceClausureHandler,
    CulturalPlaceActivationHandler,
    EventEmailNotificationHandler,
    MobilityStationRepository,
    GlobalCDCListenerService,
    TruckRepository,
  ],
  exports: [
    RabbitMqPublisherService,
    ChangeStreamsListenerService,
    MobilityStationRepository,
    GlobalCDCListenerService,
    TruckRepository,
  ],
})
export class CdcModule {}
