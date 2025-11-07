import { CulturalPlaceChangeMessage } from './cultural-place-change-message.interface';

export interface CulturalPlaceChangeHandler {
  canHandle(message: CulturalPlaceChangeMessage): boolean;
  handle(message: CulturalPlaceChangeMessage): Promise<void>;
}

