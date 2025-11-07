import { Test, TestingModule } from '@nestjs/testing';
import { EventNotificationService } from '../event-notification.service';
import { EmailService } from '../../email/email.service';
import { TicketsService } from '../../tickets/tickets.service';

describe('EventNotificationService', () => {
  let service: EventNotificationService;
  let emailService: jest.Mocked<EmailService>;
  let ticketsService: jest.Mocked<TicketsService>;

  const mockEvent = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test Event',
    description: 'Test Description',
    date: '2025-12-31T20:00:00.000Z',
    time: '20:00',
    isActive: true,
  };

  const mockUsersWithTickets = [
    {
      userId: '507f1f77bcf86cd799439013',
      userEmail: 'user1@example.com',
      userName: 'User One',
      ticketCount: 2,
      ticketTypes: ['general', 'vip'],
    },
    {
      userId: '507f1f77bcf86cd799439014',
      userEmail: 'user2@example.com',
      userName: 'User Two',
      ticketCount: 1,
      ticketTypes: ['general'],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventNotificationService,
        {
          provide: EmailService,
          useValue: {
            sendEventModificationEmail: jest.fn(),
            sendEventCancellationEmail: jest.fn(),
          },
        },
        {
          provide: TicketsService,
          useValue: {
            getUsersWithActiveTicketsForEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EventNotificationService>(EventNotificationService);
    emailService = module.get(EmailService);
    ticketsService = module.get(TicketsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processEventChange', () => {
    it('should process date change notification successfully', async () => {
      const eventChangeData = {
        event: mockEvent,
        changeType: 'date_change' as const,
        oldValue: '30/12/2025',
        newValue: '31/12/2025',
      };

      ticketsService.getUsersWithActiveTicketsForEvent.mockResolvedValue(mockUsersWithTickets);
      emailService.sendEventModificationEmail.mockResolvedValue(true);

      await service.processEventChange(eventChangeData);

      expect(ticketsService.getUsersWithActiveTicketsForEvent).toHaveBeenCalledWith(mockEvent._id);
      expect(emailService.sendEventModificationEmail).toHaveBeenCalledTimes(2);
      expect(emailService.sendEventModificationEmail).toHaveBeenCalledWith({
        userEmail: 'user1@example.com',
        userName: 'User One',
        event: mockEvent,
        modificationType: 'date_change',
        oldValue: '30/12/2025',
        newValue: '31/12/2025',
        ticketCount: 2,
        ticketTypes: ['general', 'vip'],
      });
    });

    it('should process time change notification successfully', async () => {
      const eventChangeData = {
        event: mockEvent,
        changeType: 'time_change' as const,
        oldValue: '20:00',
        newValue: '21:00',
      };

      ticketsService.getUsersWithActiveTicketsForEvent.mockResolvedValue(mockUsersWithTickets);
      emailService.sendEventModificationEmail.mockResolvedValue(true);

      await service.processEventChange(eventChangeData);

      expect(emailService.sendEventModificationEmail).toHaveBeenCalledWith({
        userEmail: 'user1@example.com',
        userName: 'User One',
        event: mockEvent,
        modificationType: 'time_change',
        oldValue: '20:00',
        newValue: '21:00',
        ticketCount: 2,
        ticketTypes: ['general', 'vip'],
      });
    });

    it('should process date_time_change notification successfully', async () => {
      const eventChangeData = {
        event: mockEvent,
        changeType: 'date_time_change' as const,
        oldValue: '30/12/2025 a las 20:00',
        newValue: '31/12/2025 a las 21:00',
      };

      ticketsService.getUsersWithActiveTicketsForEvent.mockResolvedValue(mockUsersWithTickets);
      emailService.sendEventModificationEmail.mockResolvedValue(true);

      await service.processEventChange(eventChangeData);

      expect(emailService.sendEventModificationEmail).toHaveBeenCalledWith({
        userEmail: 'user1@example.com',
        userName: 'User One',
        event: mockEvent,
        modificationType: 'date_time_change',
        oldValue: '30/12/2025 a las 20:00',
        newValue: '31/12/2025 a las 21:00',
        ticketCount: 2,
        ticketTypes: ['general', 'vip'],
      });
    });


    it('should process activation notification successfully', async () => {
      const eventChangeData = {
        event: mockEvent,
        changeType: 'activation' as const,
        oldValue: 'Inactivo',
        newValue: 'Activo',
      };

      ticketsService.getUsersWithActiveTicketsForEvent.mockResolvedValue(mockUsersWithTickets);
      emailService.sendEventModificationEmail.mockResolvedValue(true);

      await service.processEventChange(eventChangeData);

      expect(emailService.sendEventModificationEmail).toHaveBeenCalledWith({
        userEmail: 'user1@example.com',
        userName: 'User One',
        event: mockEvent,
        modificationType: 'activation',
        oldValue: 'Inactivo',
        newValue: 'Activo',
        ticketCount: 2,
        ticketTypes: ['general', 'vip'],
      });
    });

    it('should process cancellation notification successfully', async () => {
      const eventChangeData = {
        event: mockEvent,
        changeType: 'cancellation' as const,
        oldValue: 'Activo',
        newValue: 'Inactivo',
      };

      ticketsService.getUsersWithActiveTicketsForEvent.mockResolvedValue(mockUsersWithTickets);
      emailService.sendEventCancellationEmail.mockResolvedValue(true);

      await service.processEventChange(eventChangeData);

      expect(emailService.sendEventCancellationEmail).toHaveBeenCalledWith({
        userEmail: 'user1@example.com',
        userName: 'User One',
        event: mockEvent,
        ticketCount: 2,
        ticketTypes: ['general', 'vip'],
        cancellationReason: 'El evento ha sido cancelado por el organizador.',
      });
    });

    it('should handle case when no users have tickets', async () => {
      const eventChangeData = {
        event: mockEvent,
        changeType: 'date_change' as const,
        oldValue: '30/12/2025',
        newValue: '31/12/2025',
      };

      ticketsService.getUsersWithActiveTicketsForEvent.mockResolvedValue([]);

      await service.processEventChange(eventChangeData);

      expect(ticketsService.getUsersWithActiveTicketsForEvent).toHaveBeenCalledWith(mockEvent._id);
      expect(emailService.sendEventModificationEmail).not.toHaveBeenCalled();
      expect(emailService.sendEventCancellationEmail).not.toHaveBeenCalled();
    });

    it('should handle email sending errors gracefully', async () => {
      const eventChangeData = {
        event: mockEvent,
        changeType: 'date_change' as const,
        oldValue: '30/12/2025',
        newValue: '31/12/2025',
      };

      ticketsService.getUsersWithActiveTicketsForEvent.mockResolvedValue(mockUsersWithTickets);
      emailService.sendEventModificationEmail.mockRejectedValue(new Error('Email failed'));

      // Should not throw error, should handle gracefully
      await expect(service.processEventChange(eventChangeData)).resolves.not.toThrow();

      expect(emailService.sendEventModificationEmail).toHaveBeenCalledTimes(2);
    });

    it('should handle cancellation email sending errors gracefully', async () => {
      const eventChangeData = {
        event: mockEvent,
        changeType: 'cancellation' as const,
        oldValue: 'Activo',
        newValue: 'Inactivo',
      };

      ticketsService.getUsersWithActiveTicketsForEvent.mockResolvedValue(mockUsersWithTickets);
      emailService.sendEventCancellationEmail.mockRejectedValue(new Error('Email failed'));

      // Should not throw error, should handle gracefully
      await expect(service.processEventChange(eventChangeData)).resolves.not.toThrow();

      expect(emailService.sendEventCancellationEmail).toHaveBeenCalledTimes(2);
    });
  });
});
