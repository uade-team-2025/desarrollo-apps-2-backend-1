import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CulturalPlaceChangeListenerService, CULTURAL_PLACE_CHANGE_HANDLERS } from '../cultural-place-change.listener';
import { CulturalPlaceChangeHandler } from '../interfaces/cultural-place-change-handler.interface';

describe('CulturalPlaceChangeListenerService', () => {
  let service: CulturalPlaceChangeListenerService;
  const handlerMock: jest.Mocked<CulturalPlaceChangeHandler> = {
    canHandle: jest.fn(),
    handle: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CulturalPlaceChangeListenerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: CULTURAL_PLACE_CHANGE_HANDLERS,
          useValue: [handlerMock],
        },
      ],
    }).compile();

    service = module.get<CulturalPlaceChangeListenerService>(CulturalPlaceChangeListenerService);
    jest.clearAllMocks();
  });

  describe('process message flow', () => {
    it('acknowledges message when no handler available', async () => {
      const ack = jest.fn();
      const channel: any = { ack, nack: jest.fn() };
      (service as any).channel = channel;

      handlerMock.canHandle.mockReturnValue(false);

      await (service as any).handleMessage({
        content: Buffer.from(JSON.stringify({ collection: 'unknown', documentId: '1', eventType: 'UPDATE' })),
      });

      expect(ack).toHaveBeenCalled();
      expect(handlerMock.handle).not.toHaveBeenCalled();
    });

    it('delegates to handler when available', async () => {
      const ack = jest.fn();
      const channel: any = { ack, nack: jest.fn() };
      (service as any).channel = channel;

      handlerMock.canHandle.mockReturnValue(true);
      handlerMock.handle.mockResolvedValue();

      const message = { collection: 'culturalplaces', documentId: '1', eventType: 'UPDATE' };

      await (service as any).handleMessage({
        content: Buffer.from(JSON.stringify(message)),
      });

      expect(handlerMock.handle).toHaveBeenCalledWith(message);
      expect(ack).toHaveBeenCalled();
    });
  });
});

