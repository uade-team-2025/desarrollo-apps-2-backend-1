export interface MobilityStationLocation {
  type: string;
  coordinates: [number, number]; // [lng, lat]
}

export interface MobilityStation {
  _id?: string;
  name: string;
  location: MobilityStationLocation;
  capacity: number;
  bikesCount: number;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
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
