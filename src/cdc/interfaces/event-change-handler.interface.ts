export interface EventChangeMessage {
  collection: string;
  eventType: string;
  documentId: string;
  timestamp?: string;
  data?: Record<string, any>;
  updatedFields?: Record<string, any>;
}

export interface EventChangeHandler {
  canHandle(message: EventChangeMessage): boolean;
  handle(message: EventChangeMessage): Promise<void>;
}

