export interface CulturalPlaceChangeMessage {
  collection: string;
  eventType: string;
  documentId: string;
  data?: Record<string, any>;
  updatedFields?: Record<string, any>;
}

