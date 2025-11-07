import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { TicketsService } from '../tickets/tickets.service';

export interface EventChangeData {
  event: any; // Event completo
  changeType: 'date_change' | 'time_change' | 'date_time_change' | 'cancellation' | 'activation';
  oldValue?: any; // Valor original del campo modificado
  newValue?: any; // Nuevo valor del campo modificado
}

@Injectable()
export class EventNotificationService {
  private readonly logger = new Logger(EventNotificationService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly ticketsService: TicketsService,
  ) {}

  async processEventChange(data: EventChangeData): Promise<void> {
    const { event, changeType, oldValue, newValue } = data;
    this.logger.log(`Procesando notificación para evento ${event._id} - Tipo: ${changeType}`);

    const usersWithTickets = await this.ticketsService.getUsersWithActiveTicketsForEvent(event._id.toString());

    if (usersWithTickets.length === 0) {
      this.logger.log(`No hay usuarios con tickets activos para el evento ${event._id}. No se enviarán notificaciones.`);
      return;
    }

    this.logger.log(`Enviando notificaciones a ${usersWithTickets.length} usuarios para el evento ${event._id}`);

    for (const user of usersWithTickets) {
      try {
        if (changeType === 'cancellation') {
          const cancellationReason = this.resolveCancellationReason(event.status);

          await this.emailService.sendEventCancellationEmail({
            userEmail: user.userEmail,
            userName: user.userName,
            event: event,
            ticketCount: user.ticketCount,
            ticketTypes: user.ticketTypes,
            cancellationReason,
          });
          this.logger.log(`Email de cancelación enviado a ${user.userEmail} para el evento ${event._id}`);
        } else {
          // Para otros tipos de cambio, se envía una notificación de modificación
          await this.emailService.sendEventModificationEmail({
            userEmail: user.userEmail,
            userName: user.userName,
            event: event,
            modificationType: changeType,
            oldValue: oldValue || 'N/A',
            newValue: newValue || 'N/A',
            ticketCount: user.ticketCount,
            ticketTypes: user.ticketTypes,
          });
          this.logger.log(`Email de modificación enviado a ${user.userEmail} para el evento ${event._id} - Tipo: ${changeType}`);
        }
      } catch (emailError) {
        this.logger.error(`Error enviando email a ${user.userEmail} para el evento ${event._id}:`, emailError);
      }
    }

    this.logger.log(`Proceso de notificación completado para el evento ${event._id}`);
  }

  private resolveCancellationReason(status?: string): string {
    if (!status) {
      return 'El evento ha sido cancelado por el organizador.';
    }

    const normalizedStatus = status.trim().toUpperCase();

    switch (normalizedStatus) {
      case 'PAUSED_BY_CLOSURE':
        return 'El evento fue cancelado porque el espacio cultural fue clausurado.';
      case 'CANCELLED_BY_CLIMATE':
        return 'El evento fue cancelado debido a una emergencia climática.';
      case 'CANCELLED_BY_ORGANIZER':
        return 'El organizador canceló el evento.';
      default:
        return 'El evento ha sido cancelado por el organizador.';
    }
  }
}
