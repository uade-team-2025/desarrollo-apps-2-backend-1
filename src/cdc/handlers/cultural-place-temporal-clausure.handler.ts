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

    // Obtener la fecha actual y restar 4 horas para ajustar a la zona horaria de Argentina
    const now = new Date();
    const localTime = new Date(now.getTime() - 4 * 60 * 60 * 1000); // Restar 4 horas en milisegundos
    
    // Calcular inicio de 2 días antes y fin de 2 días después
    const startOfPreviousDay = new Date(localTime);
    startOfPreviousDay.setDate(startOfPreviousDay.getDate() - 2);
    startOfPreviousDay.setHours(0, 0, 0, 0);
    
    const endOfNextDay = new Date(localTime);
    endOfNextDay.setDate(endOfNextDay.getDate() + 2);
    endOfNextDay.setHours(23, 59, 59, 999);

    this.logger.log(
      `Cultural place ${culturalPlaceId} temporarily closed. Pausing events from 2 days before, previous day, today, next day, and 2 days after between ${startOfPreviousDay.toISOString()} and ${endOfNextDay.toISOString()}.`,
    );

    const modifiedCount = await this.eventRepository.updateManyByCulturalPlace(
      culturalPlaceId,
      {
        status: 'TEMPORAL_PAUSED',
        isActive: false,
      },
      {
        date: {
          $gte: startOfPreviousDay,
          $lte: endOfNextDay,
        },
        isActive: true,
      },
    );

    this.logger.log(
      `Events temporarily paused for cultural place ${culturalPlaceId} (2 days before, previous day, today, next day, and 2 days after): ${modifiedCount}`,
    );
  }
}


