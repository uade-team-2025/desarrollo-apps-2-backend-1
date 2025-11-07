import { Injectable, Logger } from '@nestjs/common';
import { EventChangeHandler, EventChangeMessage } from '../interfaces/event-change-handler.interface';
import { EventNotificationService } from '../../notifications/event-notification.service';
import { ChangeType } from '../../events/change-detection/event-change-detector.service';

@Injectable()
export class EventEmailNotificationHandler implements EventChangeHandler {
  private readonly logger = new Logger(EventEmailNotificationHandler.name);

  constructor(private readonly eventNotificationService: EventNotificationService) {}

  canHandle(message: EventChangeMessage): boolean {
    return message.collection === 'events' && message.eventType === 'UPDATE';
  }

  async handle(message: EventChangeMessage): Promise<void> {
    const currentEvent = message.data;
    if (!currentEvent) {
      this.logger.warn('Mensaje de cambio de evento sin datos actuales. Se omite.');
      return;
    }

    const updatedFields = message.updatedFields ?? {};

    const changeType = this.resolveChangeType(currentEvent, updatedFields);

    if (!changeType) {
      this.logger.debug(`Cambio en evento ${message.documentId} sin tipo crítico. Se confirma.`);
      return;
    }

    const newValue = this.buildNewValue(changeType, currentEvent);

    await this.eventNotificationService.processEventChange({
      event: currentEvent,
      changeType,
      newValue,
    });
  }

  private resolveChangeType(
    currentEvent: Record<string, any>,
    updatedFields: Record<string, any>,
  ): ChangeType {
    const dateChanged = Object.prototype.hasOwnProperty.call(updatedFields, 'date');
    const timeChanged = Object.prototype.hasOwnProperty.call(updatedFields, 'time');

    if (dateChanged && timeChanged) {
      return 'date_time_change';
    }

    if (dateChanged) {
      return 'date_change';
    }

    if (timeChanged) {
      return 'time_change';
    }

    const currentIsActive = currentEvent?.isActive;
    const statusChanged =
      Object.prototype.hasOwnProperty.call(updatedFields, 'isActive') && typeof currentIsActive === 'boolean';

    if (statusChanged) {
      return currentIsActive ? 'activation' : 'cancellation';
    }

    return null;
  }

  private buildNewValue(changeType: ChangeType, currentEvent: Record<string, any>): any {
    switch (changeType) {
      case 'date_change':
        return currentEvent.date ?? 'N/A';
      case 'time_change':
        return currentEvent.time ?? 'N/A';
      case 'date_time_change':
        return {
          date: currentEvent.date ?? 'N/A',
          time: currentEvent.time ?? 'N/A',
        };
      case 'activation':
        return 'ACTIVE';
      case 'cancellation':
        return 'INACTIVE';
      default:
        return undefined;
    }
  }
}

