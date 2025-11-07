import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BikeStationDocument = BikeStation & Document;

class Station {
  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  long: number;

  @Prop({ required: true })
  stationId: string;

  @Prop({ required: true, min: 0 })
  count: number;
}

@Schema({ timestamps: true })
export class BikeStation {
  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  eventId: Types.ObjectId;

  @Prop({
    type: [{
      lat: {
        type: Number,
        required: true
      },
      long: {
        type: Number,
        required: true
      },
      stationId: {
        type: String,
        required: true
      },
      count: {
        type: Number,
        required: true,
        min: 0
      }
    }],
    required: true,
    validate: {
      validator: function(stations: any[]) {
        return stations.length > 0;
      },
      message: 'At least one station is required'
    }
  })
  stations: Station[];
}

export const BikeStationSchema = SchemaFactory.createForClass(BikeStation);

// Indexes for efficient queries
BikeStationSchema.index({ eventId: 1 });
BikeStationSchema.index({ 'stations.stationId': 1 });
