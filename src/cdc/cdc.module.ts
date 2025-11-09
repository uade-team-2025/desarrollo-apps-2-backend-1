import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChangeStreamsListenerService } from './change-streams-listener.service';
import {
  CULTURAL_PLACE_CHANGE_HANDLERS,
  CulturalPlaceChangeListenerService,
} from './cultural-place-change.listener';
import {
  EVENT_CHANGE_HANDLERS,
  EventChangeListenerService,
} from './event-change.listener';
import { CulturalPlaceActivationHandler } from './handlers/cultural-place-activation.handler';
import { CulturalPlaceClausureHandler } from './handlers/cultural-place-clausure.handler';
import { EventEmailNotificationHandler } from './handlers/event-email-notification.handler';
import { CulturalPlaceChangeHandler } from './interfaces/cultural-place-change-handler.interface';
import { EventChangeHandler } from './interfaces/event-change-handler.interface';
import { MobilityStationsController } from './mobility-stations.controller';
import { MobilityStationsListenerService } from './mobility-stations.listener';
import { MobilityStationsService } from './mobility-stations.service';
import { RabbitMqPublisherService } from './rabbitmq-publisher.service';
import { MobilityStationRepository } from './repositories/mobility-station.repository';
import {
  MobilityStationRecord,
  MobilityStationSchema,
} from './schemas/mobility-station.schema';

@Module({
  imports: [
    ConfigModule,
    EventsModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: MobilityStationRecord.name, schema: MobilityStationSchema },
    ]),
  ],
  controllers: [MobilityStationsController],
  providers: [
    RabbitMqPublisherService,
    ChangeStreamsListenerService,
    CulturalPlaceChangeListenerService,
    CulturalPlaceClausureHandler,
    CulturalPlaceActivationHandler,
    EventChangeListenerService,
    EventEmailNotificationHandler,
    MobilityStationsService,
    MobilityStationsListenerService,
    MobilityStationRepository,
    {
      provide: CULTURAL_PLACE_CHANGE_HANDLERS,
      useFactory: (...handlers: CulturalPlaceChangeHandler[]) => handlers,
      inject: [CulturalPlaceClausureHandler, CulturalPlaceActivationHandler],
    },
    {
      provide: EVENT_CHANGE_HANDLERS,
      useFactory: (...handlers: EventChangeHandler[]) => handlers,
      inject: [EventEmailNotificationHandler],
    },
  ],
  exports: [
    RabbitMqPublisherService,
    ChangeStreamsListenerService,
    EventChangeListenerService,
    MobilityStationsService,
    MobilityStationRepository,
  ],
})
export class CdcModule {}
