import { Event } from '../schemas/event.schema';
import { EventWithCulturalPlace } from './event-with-cultural-place.interface';

export interface EventRepository {
  create(event: Partial<Event>): Promise<Event>;
  findAll(query?: any): Promise<any[]>;
  findById(id: string): Promise<any>;
  findByCulturalPlace(culturalPlaceId: string): Promise<any[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<any[]>;
  findActiveEvents(): Promise<any[]>;
  update(id: string, event: Partial<Event>): Promise<Event | null>;
  delete(id: string): Promise<boolean>;
  toggleActive(id: string): Promise<Event | null>;
  updateTicketCount(eventId: string, ticketType: string, quantity: number): Promise<boolean>;
  updateManyByCulturalPlace(
    culturalPlaceId: string,
    update: Partial<Event>,
    additionalFilter?: Record<string, any>,
  ): Promise<number>;
}
