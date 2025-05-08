// src/types/registro.ts
export type EstadoRegistro = 'Planificado' | 'En Progreso' | 'Realizado' | 'Adaptado / Saltado';

export interface RegistroDeConciencia {
  id?: string; // UUID de Supabase
  user_id?: string; // UUID del usuario
  descripcion: string;
  estado: EstadoRegistro;
  timestamp_creacion?: Date;
  tiempo_inicio?: Date | null; // Puede ser nulo
  tiempo_fin?: Date | null; // Puede ser nulo
  notas_texto_simple?: string | null;
  foco_agentes_texto_simple?: string | null;
  etiquetas_texto_simple?: string | null;
  lugar_texto_simple?: string | null;
  duracion_estimada_minutos?: number | null;
}