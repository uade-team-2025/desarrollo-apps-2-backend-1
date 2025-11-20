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
    it('pauses events from 2 days before, previous day, today, next day, and 2 days after', async () => {
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

      // Verificar que el rango de fechas incluye 2 días antes, día previo, actual, día siguiente y 2 días después
      const callArgs = repositoryMock.updateManyByCulturalPlace.mock.calls[0];
      const dateFilter = callArgs[2].date;
      const startDate = dateFilter.$gte;
      const endDate = dateFilter.$lte;
      
      // Calcular las fechas esperadas de la misma manera que el handler
      const localTime = new Date(fakeNow.getTime() - 4 * 60 * 60 * 1000);
      const expectedStartOfPreviousDay = new Date(localTime);
      expectedStartOfPreviousDay.setDate(expectedStartOfPreviousDay.getDate() - 2);
      expectedStartOfPreviousDay.setHours(0, 0, 0, 0);
      
      const expectedEndOfNextDay = new Date(localTime);
      expectedEndOfNextDay.setDate(expectedEndOfNextDay.getDate() + 2);
      expectedEndOfNextDay.setHours(23, 59, 59, 999);
      
      // Verificar que las fechas coinciden
      expect(startDate.getTime()).toBe(expectedStartOfPreviousDay.getTime());
      expect(endDate.getTime()).toBe(expectedEndOfNextDay.getTime());
      
      // Verificar que el rango es de aproximadamente 5 días (diferencia de ~120 horas)
      const diffInHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      expect(diffInHours).toBeCloseTo(120, 0); // Aproximadamente 120 horas (5 días)

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


