import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MobilityStationDocument = MobilityStationRecord & Document;

@Schema({ timestamps: true, collection: 'mobilitystation' })
export class MobilityStationRecord {
  @Prop({ required: true })
  eventId: string;

  @Prop({ required: true })
  name: string;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  })
  location: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };

  @Prop({ required: true })
  capacity: number;

  @Prop({ required: true })
  bikesCount: number;

  @Prop({ required: true })
  status: string;
}

export const MobilityStationSchema = SchemaFactory.createForClass(
  MobilityStationRecord,
);

// Índice geoespacial para búsquedas por ubicación
MobilityStationSchema.index({ location: '2dsphere' });
MobilityStationSchema.index({ eventId: 1 });
MobilityStationSchema.index({ name: 1 });
MobilityStationSchema.index({ createdAt: -1 });
