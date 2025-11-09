import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MobilityStationDocument = MobilityStationRecord & Document;

@Schema({ timestamps: true, collection: 'mobilitystation' })
export class MobilityStationRecord {
  @Prop({ required: true })
  eventId: string;

  @Prop({ required: true })
  stationId: string;

  @Prop({ required: true })
  lt: number; // latitude

  @Prop({ required: true })
  lg: number; // longitude

  @Prop({ required: true })
  count: number;

  @Prop({ default: 'bulk' })
  mode: 'bulk' | 'update';

  @Prop()
  sentAt?: Date;
}

export const MobilityStationSchema = SchemaFactory.createForClass(
  MobilityStationRecord,
);
MobilityStationSchema.index({ eventId: 1 });
MobilityStationSchema.index({ stationId: 1 });
MobilityStationSchema.index({ createdAt: -1 });
