import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RabbitMqPublisherService } from './rabbitmq-publisher.service';
import { ChangeStreamsListenerService } from './change-streams-listener.service';
import { CulturalPlaceChangeListenerService, CULTURAL_PLACE_CHANGE_HANDLERS } from './cultural-place-change.listener';
import { CulturalPlaceClausureHandler } from './handlers/cultural-place-clausure.handler';
import { CulturalPlaceActivationHandler } from './handlers/cultural-place-activation.handler';
import { CulturalPlaceChangeHandler } from './interfaces/cultural-place-change-handler.interface';
import { EventChangeListenerService, EVENT_CHANGE_HANDLERS } from './event-change.listener';
import { EventChangeHandler } from './interfaces/event-change-handler.interface';
import { EventEmailNotificationHandler } from './handlers/event-email-notification.handler';
import { MobilityStationsController } from './mobility-stations.controller';
import { MobilityStationsService } from './mobility-stations.service';
import { MobilityStationsListenerService } from './mobility-stations.listener';

@Module({
  imports: [ConfigModule, EventsModule, NotificationsModule],
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
  ],
})
export class CdcModule {}

