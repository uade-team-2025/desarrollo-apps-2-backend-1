import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TruckDocument = Truck & Document;

class Position {
  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  long: number;
}

@Schema({ timestamps: true })
export class Truck {
  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  eventId: Types.ObjectId;

  @Prop({ required: true })
  truckId: string;

  @Prop({
    type: {
      lat: {
        type: Number,
        required: true,
      },
      long: {
        type: Number,
        required: true,
      },
    },
    required: true,
  })
  position: Position;
}

export const TruckSchema = SchemaFactory.createForClass(Truck);

// Indexes for efficient queries
TruckSchema.index({ eventId: 1 });
TruckSchema.index({ truckId: 1 });
TruckSchema.index({ eventId: 1, truckId: 1 }, { unique: true });
