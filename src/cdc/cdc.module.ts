import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from '../events/events.module';
import { RabbitMqPublisherService } from './rabbitmq-publisher.service';
import { ChangeStreamsListenerService } from './change-streams-listener.service';
import { CulturalPlaceChangeListenerService, CULTURAL_PLACE_CHANGE_HANDLERS } from './cultural-place-change.listener';
import { CulturalPlaceClausureHandler } from './handlers/cultural-place-clausure.handler';

@Module({
  imports: [ConfigModule, EventsModule],
  providers: [
    RabbitMqPublisherService,
    ChangeStreamsListenerService,
    CulturalPlaceChangeListenerService,
    CulturalPlaceClausureHandler,
    {
      provide: CULTURAL_PLACE_CHANGE_HANDLERS,
      useFactory: (...handlers: CulturalPlaceClausureHandler[]) => handlers,
      inject: [CulturalPlaceClausureHandler],
    },
  ],
})
export class CdcModule {}

