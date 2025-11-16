export interface PuntoActual {
  latitud: number;
  longitud: number;
}

export interface InformacionAdicional {
  id_evento: string;
}

export interface TruckMessage {
  id_ruta: string;
  indice_punto_actual: number;
  total_puntos: number;
  punto_actual: PuntoActual;
  porcentaje_progreso: number;
  informacion_adicional: InformacionAdicional[];
}
