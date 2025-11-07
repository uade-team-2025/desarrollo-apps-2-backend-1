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

    const status = message.data?.status;
    return typeof status === 'string' && status.toUpperCase() === 'CLAUSURADO';
  }

  async handle(message: CulturalPlaceChangeMessage): Promise<void> {
    const culturalPlaceId = message.data?._id || message.documentId;

    if (!culturalPlaceId) {
      this.logger.warn('Mensaje de clausura sin ID de lugar cultural. Se omite.');
      return;
    }

    this.logger.log(`Lugar cultural ${culturalPlaceId} clausurado. Pausando eventos asociados.`);

    const modifiedCount = await this.eventRepository.updateManyByCulturalPlace(
      culturalPlaceId,
      {
        status: 'PAUSADO_POR_CLAUSURA',
        isActive: false,
      },
      {
        $or: [
          { status: { $ne: 'PAUSADO_POR_CLAUSURA' } },
          { isActive: { $ne: false } },
        ],
      },
    );

    this.logger.log(`Eventos pausados por clausura para lugar ${culturalPlaceId}: ${modifiedCount}`);
  }
}

