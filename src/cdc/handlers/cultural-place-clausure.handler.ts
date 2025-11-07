import { Injectable, Logger, Inject } from '@nestjs/common';
import { CulturalPlaceChangeHandler } from '../interfaces/cultural-place-change-handler.interface';
import { CulturalPlaceChangeMessage } from '../interfaces/cultural-place-change-message.interface';
import { EVENT_REPOSITORY } from '../../events/interfaces/event.repository.token';
import type { EventRepository } from '../../events/interfaces/event.repository.interface';

@Injectable()
export class CulturalPlaceClausureHandler implements CulturalPlaceChangeHandler {
  private readonly logger = new Logger(CulturalPlaceClausureHandler.name);

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

    return status.toUpperCase() === 'CLOSED_DOWN';
  }

  async handle(message: CulturalPlaceChangeMessage): Promise<void> {
    const culturalPlaceId = message.data?._id || message.documentId;

    if (!culturalPlaceId) {
      this.logger.warn('Closed-down message without cultural place ID. Skipping.');
      return;
    }

    const status = (message.updatedFields?.status ?? message.data?.status) as string | undefined;

    this.logger.log(`Cultural place ${culturalPlaceId} closed down. Pausing related events.`);

    const modifiedCount = await this.eventRepository.updateManyByCulturalPlace(
      culturalPlaceId,
      {
        status: 'PAUSED_BY_CLOSURE',
        isActive: false,
      },
      {
        $or: [
          { status: { $ne: 'PAUSED_BY_CLOSURE' } },
          { isActive: { $ne: false } },
        ],
      },
    );

    this.logger.log(`Events paused by closure for cultural place ${culturalPlaceId}: ${modifiedCount}`);
  }
}

