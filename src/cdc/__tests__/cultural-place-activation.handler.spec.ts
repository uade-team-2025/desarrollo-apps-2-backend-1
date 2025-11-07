import { Test, TestingModule } from '@nestjs/testing';
import { CulturalPlaceActivationHandler } from '../handlers/cultural-place-activation.handler';
import { EVENT_REPOSITORY } from '../../events/interfaces/event.repository.token';

describe('CulturalPlaceActivationHandler', () => {
  let handler: CulturalPlaceActivationHandler;
  const repositoryMock = {
    updateManyByCulturalPlace: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CulturalPlaceActivationHandler,
        {
          provide: EVENT_REPOSITORY,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    handler = module.get<CulturalPlaceActivationHandler>(CulturalPlaceActivationHandler);
    jest.clearAllMocks();
  });

  describe('canHandle', () => {
    it('returns true when status is ACTIVE', () => {
      expect(
        handler.canHandle({
          collection: 'culturalplaces',
          eventType: 'UPDATE',
          documentId: 'id',
          updatedFields: { status: 'ACTIVE' },
        }),
      ).toBe(true);
    });

    it('returns false for other collections', () => {
      expect(
        handler.canHandle({
          collection: 'events',
          eventType: 'UPDATE',
          documentId: 'id',
          updatedFields: { status: 'ACTIVE' },
        }),
      ).toBe(false);
    });

    it('returns false when status is not ACTIVO', () => {
      expect(
        handler.canHandle({
          collection: 'culturalplaces',
          eventType: 'UPDATE',
          documentId: 'id',
          updatedFields: { status: 'INACTIVO' },
        }),
      ).toBe(false);
    });
  });

  describe('handle', () => {
    it('reactivates events', async () => {
      repositoryMock.updateManyByCulturalPlace.mockResolvedValue(3);

      await handler.handle({
        collection: 'culturalplaces',
        eventType: 'UPDATE',
        documentId: '507f1f77bcf86cd799439011',
        data: { _id: '507f1f77bcf86cd799439011', status: 'PAUSED_BY_CLOSURE' },
        updatedFields: { status: 'ACTIVE' },
      });

      expect(repositoryMock.updateManyByCulturalPlace).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
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
    });

    it('ignores message without ID', async () => {
      await handler.handle({
        collection: 'culturalplaces',
        eventType: 'UPDATE',
        documentId: '',
        updatedFields: { status: 'ACTIVE' },
      });

      expect(repositoryMock.updateManyByCulturalPlace).not.toHaveBeenCalled();
    });
  });
});

