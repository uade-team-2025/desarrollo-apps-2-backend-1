import { Injectable } from '@nestjs/common';
import { CreateEventDto } from '../dto/create-event.dto';
import { Types } from 'mongoose';

@Injectable()
export class EventDataTransformer {
  /**
   * Transforma los datos del DTO para la creación de un evento
   */
  transformCreateEventData(createEventDto: CreateEventDto): any {
    const normalizedStatus = createEventDto.status?.trim() || 'ACTIVE';
    const isActive =
      createEventDto.isActive !== undefined ? createEventDto.isActive : normalizedStatus.toUpperCase() === 'ACTIVE';

    return {
      ...createEventDto,
      culturalPlaceId: new Types.ObjectId(createEventDto.culturalPlaceId),
      date: new Date(createEventDto.date),
      status: normalizedStatus,
      isActive,
      ticketTypes: createEventDto.ticketTypes.map(ticketType => ({
        ...ticketType,
        soldQuantity: 0,
        isActive: ticketType.isActive ?? true
      }))
    };
  }

  /**
   * Transforma las coordenadas GeoJSON del lugar cultural a formato {lat, lng} para mantener compatibilidad con el frontend
   */
  transformEventCoordinates(event: any): any {
    // El repositorio ya devuelve objetos planos
    if (event && event.culturalPlaceId && event.culturalPlaceId.contact && event.culturalPlaceId.contact.coordinates) {
      const coordinates = event.culturalPlaceId.contact.coordinates;
      
      // Si ya está en formato {lat, lng}, devolverlo tal como está
      if (coordinates.lat !== undefined && coordinates.lng !== undefined) {
        return event;
      }
      
      // Si está en formato GeoJSON, convertir a {lat, lng}
      if (coordinates.type === 'Point' && Array.isArray(coordinates.coordinates)) {
        return {
          ...event,
          culturalPlaceId: {
            ...event.culturalPlaceId,
            contact: {
              ...event.culturalPlaceId.contact,
              coordinates: {
                lat: coordinates.coordinates[1], // lat es el segundo elemento
                lng: coordinates.coordinates[0]  // lng es el primer elemento
              }
            }
          }
        };
      }
    }
    
    return event;
  }

  /**
   * Transforma un array de eventos aplicando la transformación de coordenadas
   */
  transformEventsCoordinates(events: any[]): any[] {
    return events.map(event => {
      return this.transformEventCoordinates(event);
    });
  }

}
