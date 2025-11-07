import { Injectable } from '@nestjs/common';
import { ChangeType } from './event-change-detector.service';

@Injectable()
export class ChangeValueFormatter {
  /**
   * Formatea los valores de cambio para notificaciones
   */
  async getChangeValues(originalEvent: any, updatedEvent: any, changeType: ChangeType): Promise<{ oldValue: any; newValue: any }> {
    const baseOriginal = originalEvent ?? {};
    const baseUpdated = updatedEvent ?? {};

    switch (changeType) {
      case 'date_change':
        return this.formatDateChange(baseOriginal, baseUpdated);
      
      case 'date_time_change':
        return this.formatDateTimeChange(baseOriginal, baseUpdated);
      
      case 'time_change':
        return {
          oldValue: baseOriginal.time ?? 'N/A',
          newValue: baseUpdated.time ?? 'N/A',
        };
      
      case 'activation':
        return {
          oldValue: typeof baseOriginal.isActive === 'boolean' ? (baseOriginal.isActive ? 'Activo' : 'Inactivo') : 'Desconocido',
          newValue: typeof baseUpdated.isActive === 'boolean' ? (baseUpdated.isActive ? 'Activo' : 'Inactivo') : 'Desconocido',
        };
      
      case 'cancellation':
        return {
          oldValue: typeof baseOriginal.isActive === 'boolean' ? (baseOriginal.isActive ? 'Activo' : 'Inactivo') : 'Desconocido',
          newValue: typeof baseUpdated.isActive === 'boolean' ? (baseUpdated.isActive ? 'Activo' : 'Inactivo') : 'Desconocido',
        };
      
      default:
        return {
          oldValue: 'N/A',
          newValue: 'N/A',
        };
    }
  }

  /**
   * Formatea cambios de fecha
   */
  private formatDateChange(originalEvent: any, updatedEvent: any): { oldValue: any; newValue: any } {
    try {
      let originalDate: Date;
      let updatedDate: Date;
      
      // Para originalEvent, puede que sea un string o un objeto Date
      if (originalEvent.date instanceof Date) {
        originalDate = originalEvent.date;
      } else if (typeof originalEvent.date === 'string') {
        originalDate = new Date(originalEvent.date);
      } else {
        originalDate = new Date(originalEvent.date?.toString() || originalEvent.date);
      }
      
      // Para updatedEvent, debería ser un string ISO
      if (updatedEvent.date instanceof Date) {
        updatedDate = updatedEvent.date;
      } else {
        updatedDate = new Date(updatedEvent.date);
      }
      
      return {
        oldValue: isNaN(originalDate.getTime()) ? `Fecha inválida (${originalEvent.date})` : new Date(originalDate.getTime() + 4 * 60 * 60 * 1000).toLocaleDateString('es-ES'),
        newValue: isNaN(updatedDate.getTime()) ? `Fecha inválida (${updatedEvent.date})` : new Date(updatedDate.getTime() + 4 * 60 * 60 * 1000).toLocaleDateString('es-ES'),
      };
    } catch (error) {
      return {
        oldValue: `Error al formatear fecha original: ${originalEvent.date}`,
        newValue: `Error al formatear fecha nueva: ${updatedEvent.date}`,
      };
    }
  }

  /**
   * Formatea cambios de fecha y hora
   */
  private formatDateTimeChange(originalEvent: any, updatedEvent: any): { oldValue: any; newValue: any } {
    try {
      let originalDate: Date;
      let updatedDate: Date;
      
      if (originalEvent.date instanceof Date) {
        originalDate = originalEvent.date;
      } else if (typeof originalEvent.date === 'string') {
        originalDate = new Date(originalEvent.date);
      } else {
        originalDate = new Date(originalEvent.date?.toString() || originalEvent.date);
      }
      
      if (updatedEvent.date instanceof Date) {
        updatedDate = updatedEvent.date;
      } else {
        updatedDate = new Date(updatedEvent.date);
      }
      
      const originalFormatted = isNaN(originalDate.getTime()) 
        ? `Fecha inválida (${originalEvent.date})` 
        : `${new Date(originalDate.getTime() + 4 * 60 * 60 * 1000).toLocaleDateString('es-ES')} a las ${originalEvent.time}`;
      
      const updatedFormatted = isNaN(updatedDate.getTime()) 
        ? `Fecha inválida (${updatedEvent.date})` 
        : `${new Date(updatedDate.getTime() + 4 * 60 * 60 * 1000).toLocaleDateString('es-ES')} a las ${updatedEvent.time}`;
      
      return {
        oldValue: originalFormatted,
        newValue: updatedFormatted,
      };
    } catch (error) {
      return {
        oldValue: `Error al formatear fecha/hora original: ${originalEvent.date} ${originalEvent.time}`,
        newValue: `Error al formatear fecha/hora nueva: ${updatedEvent.date} ${updatedEvent.time}`,
      };
    }
  }
}
