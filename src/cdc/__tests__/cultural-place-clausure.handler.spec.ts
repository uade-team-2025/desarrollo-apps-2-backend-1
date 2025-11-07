import { Test, TestingModule } from '@nestjs/testing';
import { CulturalPlaceClausureHandler } from '../handlers/cultural-place-clausure.handler';
import { EVENT_REPOSITORY } from '../../events/interfaces/event.repository.token';

describe('CulturalPlaceClausureHandler', () => {
  let handler: CulturalPlaceClausureHandler;
  const repositoryMock = {
    updateManyByCulturalPlace: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CulturalPlaceClausureHandler,
        {
          provide: EVENT_REPOSITORY,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    handler = module.get<CulturalPlaceClausureHandler>(CulturalPlaceClausureHandler);
    jest.clearAllMocks();
  });

  describe('canHandle', () => {
    it('returns true when status is CLOSED_DOWN', () => {
      expect(
        handler.canHandle({
          collection: 'culturalplaces',
          eventType: 'UPDATE',
          documentId: 'id',
          data: { status: 'ACTIVE' },
          updatedFields: { status: 'CLOSED_DOWN' },
        }),
      ).toBe(true);
    });

    it('returns false for other collections', () => {
      expect(
        handler.canHandle({
          collection: 'events',
          eventType: 'UPDATE',
          documentId: 'id',
          updatedFields: { status: 'CLOSED_DOWN' },
        }),
      ).toBe(false);
    });

    it('returns false when status is not clausurado', () => {
      expect(
        handler.canHandle({
          collection: 'culturalplaces',
          eventType: 'UPDATE',
          documentId: 'id',
          updatedFields: { status: 'ACTIVE' },
        }),
      ).toBe(false);
    });
  });

  describe('handle', () => {
    it('pauses events when clausurado', async () => {
      repositoryMock.updateManyByCulturalPlace.mockResolvedValue(2);

      await handler.handle({
        collection: 'culturalplaces',
        eventType: 'UPDATE',
        documentId: '507f1f77bcf86cd799439011',
        data: { _id: '507f1f77bcf86cd799439011', status: 'ACTIVE' },
        updatedFields: { status: 'CLOSED_DOWN' },
      });

      expect(repositoryMock.updateManyByCulturalPlace).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
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
    });

    it('ignores message without ID', async () => {
      await handler.handle({
        collection: 'culturalplaces',
        eventType: 'UPDATE',
        documentId: '',
        updatedFields: { status: 'CLOSED_DOWN' },
      });

      expect(repositoryMock.updateManyByCulturalPlace).not.toHaveBeenCalled();
    });
  });
});

