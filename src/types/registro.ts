export type EstadoRegistro = 'Planificado' | 'En Progreso' | 'Realizado' | 'Adaptado / Saltado';


export type TipoAutorNota = 'Yo' | 'Sistema' | 'Mentor';
export type TipoPrivacidadNota = 'Privada' | 'CompartidaContexto' | 'CompartidaMentor';

export interface Nota {
  id?: string;
  registro_id: string;
  user_id?: string;
  texto: string;
  autor?: TipoAutorNota;
  privacidad?: TipoPrivacidadNota;
  timestamp_creacion?: Date;

  tipo_nota?: 'Prospectiva' | 'Retrospectiva';
}

export interface RegistroDeConciencia {
  id?: string;
  user_id?: string;
  descripcion: string;
  estado: EstadoRegistro;
  timestamp_creacion?: Date;
  tiempo_inicio?: Date | null;
  tiempo_fin?: Date | null;
  foco_agentes?: string[] | null;
  etiquetas?: string[] | null;
  lugar_texto_simple?: string | null;
  duracion_estimada_minutos?: number | null;

  sensacion_kinestesica?: string | null;
  prioridad?: number | null;


}


export interface ImportResult {
  notasAgregadas: number;
  registrosSugeridos: number;
}


export interface Insight {
  id: string;
  type: 'pattern' | 'void';
  message: string;
  relatedRegistroId?: string;
  relatedPeriodoVacioId?: string;
}


export interface PeriodoVacioAnotado {
  id?: string;
  user_id?: string;
  fecha: Date;
  hora_inicio: Date;
  hora_fin: Date;
  duracion_segundos: number;
  etiquetas?: string[] | null;
  nota?: string | null;
  timestamp_creacion?: Date;
}