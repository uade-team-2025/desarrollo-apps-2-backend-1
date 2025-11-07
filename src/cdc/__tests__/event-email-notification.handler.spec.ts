import { Test, TestingModule } from '@nestjs/testing';
import { EventEmailNotificationHandler } from '../handlers/event-email-notification.handler';
import { EventNotificationService } from '../../notifications/event-notification.service';

describe('EventEmailNotificationHandler', () => {
  let handler: EventEmailNotificationHandler;
  const notificationServiceMock = {
    processEventChange: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventEmailNotificationHandler,
        {
          provide: EventNotificationService,
          useValue: notificationServiceMock,
        },
      ],
    }).compile();

    handler = module.get<EventEmailNotificationHandler>(EventEmailNotificationHandler);
    jest.clearAllMocks();
  });

  it('canHandle should return true for event updates', () => {
    expect(
      handler.canHandle({
        collection: 'events',
        eventType: 'UPDATE',
        documentId: '123',
      }),
    ).toBe(true);
  });

  it('canHandle should return false for other collections', () => {
    expect(
      handler.canHandle({
        collection: 'tickets',
        eventType: 'UPDATE',
        documentId: '123',
      }),
    ).toBe(false);
  });

  it('processes date change notifications', async () => {
    const message = {
      collection: 'events',
      eventType: 'UPDATE',
      documentId: '507f1f77bcf86cd799439011',
      updatedFields: { date: '2025-12-31T20:00:00.000Z' },
      data: { date: '2025-12-31T20:00:00.000Z', time: '20:00', isActive: true, _id: '507f1f77bcf86cd799439011' },
    };

    await handler.handle(message);

    expect(notificationServiceMock.processEventChange).toHaveBeenCalledWith(
      expect.objectContaining({
        event: message.data,
        changeType: 'date_change',
        newValue: '2025-12-31T20:00:00.000Z',
      }),
    );
  });

  it('processes activation notifications', async () => {
    const message = {
      collection: 'events',
      eventType: 'UPDATE',
      documentId: '507f1f77bcf86cd799439011',
      updatedFields: { isActive: true },
      data: { isActive: true, _id: '507f1f77bcf86cd799439011' },
    };

    await handler.handle(message);

    expect(notificationServiceMock.processEventChange).toHaveBeenCalledWith(
      expect.objectContaining({
        event: message.data,
        changeType: 'activation',
        newValue: 'ACTIVE',
      }),
    );
  });

  it('ignores messages without relevant changes', async () => {
    const message = {
      collection: 'events',
      eventType: 'UPDATE',
      documentId: '507f1f77bcf86cd799439011',
      updatedFields: { description: 'Nueva descripción' },
      data: { description: 'Nueva descripción' },
    };

    await handler.handle(message);

    expect(notificationServiceMock.processEventChange).not.toHaveBeenCalled();
  });
});

