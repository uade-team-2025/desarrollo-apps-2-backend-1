export interface MobilityStation {
  stationId: string;
  lt: number;
  lg: number;
  count: number;
}

export interface MobilityStationsMessage {
  eventId: string;
  stations: MobilityStation[];
  metadata: {
    mode: 'bulk' | 'update';
    sentAt: string;
    totalStations: number;
  };
}

