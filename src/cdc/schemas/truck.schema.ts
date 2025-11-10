import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TruckDocument = TruckRecord & Document;

@Schema({ timestamps: true, collection: 'trucks' })
export class TruckRecord {
  @Prop({ required: true })
  eventId: string;

  @Prop({ required: true })
  truckId: string;

  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  long: number;
}

export const TruckSchema = SchemaFactory.createForClass(TruckRecord);
TruckSchema.index({ eventId: 1 });
TruckSchema.index({ truckId: 1 });
TruckSchema.index({ createdAt: -1 });
