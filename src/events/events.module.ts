import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event, EventSchema } from './schemas/event.schema';
import { EVENT_REPOSITORY } from './interfaces/event.repository.token';
import { MongoDBEventRepository } from './repositories/mongodb-event.repository';
import { EventInventoryService } from './event-inventory.service';

// Validators
import { EventValidator } from './validators/event.validator';
import { TicketValidator } from './validators/ticket.validator';

// Transformers
import { EventDataTransformer } from './transformers/event-data.transformer';

// Change Detection
import { EventChangeDetector } from './change-detection/event-change-detector.service';
import { ChangeValueFormatter } from './change-detection/change-value-formatter.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema }
    ]),
  ],
  controllers: [EventsController],
  providers: [
    EventsService,
    EventInventoryService,
    {
      provide: EVENT_REPOSITORY,
      useClass: MongoDBEventRepository,
    },
    // Validators
    EventValidator,
    TicketValidator,
    // Transformers
    EventDataTransformer,
    // Change Detection
    EventChangeDetector,
    ChangeValueFormatter,
  ],
  exports: [EventsService, EventInventoryService, EVENT_REPOSITORY],
})
export class EventsModule {}
