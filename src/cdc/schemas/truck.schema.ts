import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TruckDocument = TruckRecord & Document;

@Schema({ timestamps: true, collection: 'trucks' })
export class TruckRecord {
  @Prop({ required: true, unique: true })
  id_ruta: string;

  @Prop({ required: true })
  indice_punto_actual: number;

  @Prop({ required: true })
  total_puntos: number;

  @Prop({
    type: {
      latitud: { type: Number, required: true },
      longitud: { type: Number, required: true },
    },
    required: true,
  })
  punto_actual: {
    latitud: number;
    longitud: number;
  };

  @Prop({ required: true })
  porcentaje_progreso: number;

  @Prop({
    type: [
      {
        id_evento: { type: String, required: true },
      },
    ],
    required: true,
  })
  informacion_adicional: Array<{
    id_evento: string;
  }>;
}

export const TruckSchema = SchemaFactory.createForClass(TruckRecord);
TruckSchema.index({ id_ruta: 1 }, { unique: true });
TruckSchema.index({ createdAt: -1 });
TruckSchema.index({ 'informacion_adicional.id_evento': 1 });
