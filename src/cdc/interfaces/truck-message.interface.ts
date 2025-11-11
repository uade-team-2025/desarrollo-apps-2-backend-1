export interface Position {
  lat: number;
  long: number;
}

export interface TruckMessage {
  eventId: string;
  truckId: string;
  position: Position;
}
