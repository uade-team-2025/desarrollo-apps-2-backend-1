import { Injectable, Logger, Inject } from '@nestjs/common';
import { CulturalPlaceChangeHandler } from '../interfaces/cultural-place-change-handler.interface';
import { CulturalPlaceChangeMessage } from '../interfaces/cultural-place-change-message.interface';
import { EVENT_REPOSITORY } from '../../events/interfaces/event.repository.token';
import type { EventRepository } from '../../events/interfaces/event.repository.interface';

@Injectable()
export class CulturalPlaceTemporalClausureHandler implements CulturalPlaceChangeHandler {
  private readonly logger = new Logger(CulturalPlaceTemporalClausureHandler.name);

  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: EventRepository,
  ) {}

  canHandle(message: CulturalPlaceChangeMessage): boolean {
    if (message.collection !== 'culturalplaces') {
      return false;
    }

    const status = (message.updatedFields?.status ?? message.data?.status) as string | undefined;
    if (!status) {
      return false;
    }

    return status.toUpperCase() === 'TEMPORAL_CLOSED_DOWN';
  }

  async handle(message: CulturalPlaceChangeMessage): Promise<void> {
    const culturalPlaceId = message.data?._id || message.documentId;

    if (!culturalPlaceId) {
      this.logger.warn('Temporary closure message without cultural place ID. Skipping.');
      return;
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    this.logger.log(
      `Cultural place ${culturalPlaceId} temporarily closed. Pausing today's events between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}.`,
    );

    const modifiedCount = await this.eventRepository.updateManyByCulturalPlace(
      culturalPlaceId,
      {
        status: 'TEMPORAL_PAUSED',
        isActive: false,
      },
      {
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        isActive: true,
      },
    );

    this.logger.log(
      `Events temporarily paused for cultural place ${culturalPlaceId} (today only): ${modifiedCount}`,
    );
  }
}


