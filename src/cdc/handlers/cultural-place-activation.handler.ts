import { Injectable, Logger, Inject } from '@nestjs/common';
import { CulturalPlaceChangeHandler } from '../interfaces/cultural-place-change-handler.interface';
import { CulturalPlaceChangeMessage } from '../interfaces/cultural-place-change-message.interface';
import { EVENT_REPOSITORY } from '../../events/interfaces/event.repository.token';
import type { EventRepository } from '../../events/interfaces/event.repository.interface';

@Injectable()
export class CulturalPlaceActivationHandler implements CulturalPlaceChangeHandler {
  private readonly logger = new Logger(CulturalPlaceActivationHandler.name);

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

    return status.toUpperCase() === 'ACTIVE';
  }

  async handle(message: CulturalPlaceChangeMessage): Promise<void> {
    const culturalPlaceId = message.data?._id || message.documentId;

    if (!culturalPlaceId) {
      this.logger.warn('Mensaje de activación sin ID de lugar cultural. Se omite.');
      return;
    }

    this.logger.log(`Cultural place ${culturalPlaceId} restored to ACTIVE. Reactivating events.`);

    const modifiedCount = await this.eventRepository.updateManyByCulturalPlace(
      culturalPlaceId,
      {
        status: 'ACTIVE',
        isActive: true,
      },
      {
        $or: [
          { status: { $ne: 'ACTIVE' } },
          { isActive: { $ne: true } },
        ],
      },
    );

    this.logger.log(`Events reactivated for cultural place ${culturalPlaceId}: ${modifiedCount}`);
  }
}

