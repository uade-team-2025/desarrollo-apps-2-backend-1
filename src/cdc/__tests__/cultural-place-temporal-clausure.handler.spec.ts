import { Test, TestingModule } from '@nestjs/testing';
import { CulturalPlaceTemporalClausureHandler } from '../handlers/cultural-place-temporal-clausure.handler';
import { EVENT_REPOSITORY } from '../../events/interfaces/event.repository.token';

describe('CulturalPlaceTemporalClausureHandler', () => {
  let handler: CulturalPlaceTemporalClausureHandler;
  const repositoryMock = {
    updateManyByCulturalPlace: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CulturalPlaceTemporalClausureHandler,
        {
          provide: EVENT_REPOSITORY,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    handler = module.get<CulturalPlaceTemporalClausureHandler>(CulturalPlaceTemporalClausureHandler);
    jest.clearAllMocks();
  });

  describe('canHandle', () => {
    it('returns true when status is TEMPORAL_CLOSED_DOWN', () => {
      expect(
        handler.canHandle({
          collection: 'culturalplaces',
          eventType: 'UPDATE',
          documentId: 'id',
          updatedFields: { status: 'TEMPORAL_CLOSED_DOWN' },
        }),
      ).toBe(true);
    });

    it('returns false for other collections', () => {
      expect(
        handler.canHandle({
          collection: 'events',
          eventType: 'UPDATE',
          documentId: 'id',
          updatedFields: { status: 'TEMPORAL_CLOSED_DOWN' },
        }),
      ).toBe(false);
    });

    it('returns false when status is different', () => {
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
    it('pauses only today events', async () => {
      repositoryMock.updateManyByCulturalPlace.mockResolvedValue(1);
      const fakeNow = new Date('2025-01-15T12:00:00.000Z');
      jest.useFakeTimers().setSystemTime(fakeNow);

      await handler.handle({
        collection: 'culturalplaces',
        eventType: 'UPDATE',
        documentId: '507f1f77bcf86cd799439011',
        data: { _id: '507f1f77bcf86cd799439011', status: 'ACTIVE' },
        updatedFields: { status: 'TEMPORAL_CLOSED_DOWN' },
      });

      expect(repositoryMock.updateManyByCulturalPlace).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        {
          status: 'TEMPORAL_PAUSED',
          isActive: false,
        },
        expect.objectContaining({
          date: {
            $gte: expect.any(Date),
            $lte: expect.any(Date),
          },
          isActive: true,
        }),
      );

      jest.useRealTimers();
    });

    it('ignores message without ID', async () => {
      await handler.handle({
        collection: 'culturalplaces',
        eventType: 'UPDATE',
        documentId: '',
        updatedFields: { status: 'TEMPORAL_CLOSED_DOWN' },
      });

      expect(repositoryMock.updateManyByCulturalPlace).not.toHaveBeenCalled();
    });
  });
});


