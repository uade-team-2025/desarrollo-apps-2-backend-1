import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EventDocument = Event & Document;

@Schema({ timestamps: true })
export class Event {
  @Prop({ type: Types.ObjectId, ref: 'CulturalPlace', required: true })
  culturalPlaceId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  time: string;

  @Prop({
    type: [{
      type: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
      initialQuantity: {
        type: Number,
        required: true,
        min: 1
      },
      soldQuantity: {
        type: Number,
        default: 0,
        min: 0
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    required: true,
    validate: {
      validator: function(ticketTypes: any[]) {
        return ticketTypes.length > 0;
      },
      message: 'At least one ticket type is required'
    }
  })
  ticketTypes: Array<{
    type: string;
    price: number;
    initialQuantity: number;
    soldQuantity: number;
    isActive: boolean;
  }>;

  @Prop({ required: false })
  image: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 'ACTIVE', trim: true })
  status: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);

// Indexes for efficient queries
EventSchema.index({ culturalPlaceId: 1 });
EventSchema.index({ date: 1 });
EventSchema.index({ culturalPlaceId: 1, date: 1 });
EventSchema.index({ isActive: 1 });
EventSchema.index({ date: 1, isActive: 1 });
EventSchema.index({ status: 1 });

// Virtual for available quantity
EventSchema.virtual('availableQuantity').get(function() {
  if (!this.ticketTypes || !Array.isArray(this.ticketTypes)) {
    return null;

  }
  return this.ticketTypes.reduce((total, ticketType) => {
    return total + (ticketType.initialQuantity - ticketType.soldQuantity);
  }, 0);
});

// Transform dates to add 4 hours for timezone compensation
EventSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret: any) {
    // Add 4 hours to date, createdAt, and updatedAt
    if (ret.date) {
      ret.date = new Date(new Date(ret.date).getTime() + 4 * 60 * 60 * 1000);
    }
    if (ret.createdAt) {
      ret.createdAt = new Date(new Date(ret.createdAt).getTime() + 4 * 60 * 60 * 1000);
    }
    if (ret.updatedAt) {
      ret.updatedAt = new Date(new Date(ret.updatedAt).getTime() + 4 * 60 * 60 * 1000);
    }
    return ret;
  }
});

EventSchema.set('toObject', { 
  virtuals: true,
  transform: function(doc, ret: any) {
    // Add 4 hours to date, createdAt, and updatedAt
    if (ret.date) {
      ret.date = new Date(new Date(ret.date).getTime() + 4 * 60 * 60 * 1000);
    }
    if (ret.createdAt) {
      ret.createdAt = new Date(new Date(ret.createdAt).getTime() + 4 * 60 * 60 * 1000);
    }
    if (ret.updatedAt) {
      ret.updatedAt = new Date(new Date(ret.updatedAt).getTime() + 4 * 60 * 60 * 1000);
    }
    return ret;
  }
});
