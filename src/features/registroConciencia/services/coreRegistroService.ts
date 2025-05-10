// src/features/registroConciencia/services/coreRegistroService.ts
// Contiene funciones principales de gestión de registros y notas.

import supabase from '../../../assets/supabase/client'; // <--- ¡AJUSTA ESTA RUTA!
import { RegistroDeConciencia, EstadoRegistro, Nota, TipoAutorNota, TipoPrivacidadNota } from '../../../types/registro'; // Import necessary types

export async function addRegistro(registro: Partial<RegistroDeConciencia>): Promise<RegistroDeConciencia> {
  if (!supabase) {
    console.error("El cliente Supabase no está disponible en addRegistro.");
    throw new Error("Fallo en la configuración del cliente Supabase.");
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('Error obteniendo sesión:', sessionError);
    throw new Error('Error al obtener la sesión del usuario.');
  }
  if (!sessionData.session) {
    throw new Error('Usuario no autenticado. No se puede guardar el registro.');
  }

  const userId = sessionData.session.user.id;

  const registroDbPayload = {
    descripcion: registro.descripcion,
    estado: registro.estado,
    user_id: userId,
    tiempo_inicio: registro.tiempo_inicio instanceof Date ? registro.tiempo_inicio.toISOString() : null,
    tiempo_fin: registro.tiempo_fin instanceof Date ? registro.tiempo_fin.toISOString() : null,
    foco_agentes: registro.foco_agentes,
    etiquetas: registro.etiquetas,
    lugar_texto_simple: registro.lugar_texto_simple || null,
    duracion_estimada_minutos: registro.duracion_estimada_minutos === undefined || registro.duracion_estimada_minutos === null ? null : Number(registro.duracion_estimada_minutos),
    sensacion_kinestesica: registro.sensacion_kinestesica || null,
    prioridad: registro.prioridad === undefined || registro.prioridad === null ? null : Number(registro.prioridad), // Include priority
  };

  const { data, error } = await supabase
    .from('registros_de_conciencia')
    .insert([registroDbPayload])
    .select()
    .single();

  if (error) {
    console.error('Error al insertar en Supabase:', error);
    throw error;
  }

  if (!data) {
    console.error('No se devolvieron datos después de la inserción.');
    throw new Error('No se devolvieron datos después de la inserción.');
  }

  return {
    ...data,
    id: data.id,
    user_id: data.user_id,
    descripcion: data.descripcion,
    estado: data.estado,
    timestamp_creacion: data.timestamp_creacion ? new Date(data.timestamp_creacion) : undefined,
    tiempo_inicio: data.tiempo_inicio ? new Date(data.tiempo_inicio) : null,
    tiempo_fin: data.tiempo_fin ? new Date(data.tiempo_fin) : null,
    notas_texto_simple: (data as any).notas_texto_simple, // Corrected access
    foco_agentes: data.foco_agentes,
    etiquetas: data.etiquetas,
    lugar_texto_simple: data.lugar_texto_simple,
    duracion_estimada_minutos: data.duracion_estimada_minutos,
    sensacion_kinestesica: data.sensacion_kinestesica,
    prioridad: (data as any).prioridad, // Include priority in return type
  } as RegistroDeConciencia;
}

// Función para añadir una sola nota a la base de datos
export async function addNota(nota: Partial<Nota>): Promise<Nota> {
  if (!supabase) {
     console.error("Cliente Supabase no disponible para añadir nota.");
     throw new Error("Fallo en la configuración del cliente Supabase.");
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    throw new Error('Usuario no autenticado. No se puede guardar la nota.');
  }
  const userId = sessionData.session.user.id;

  if (!nota.registro_id || !nota.texto) {
      throw new Error("registro_id y texto son requeridos para añadir una nota.");
  }

  const notaParaGuardar = {
    ...nota,
    user_id: userId,
    // Ensure timestamp_creacion is a valid ISO string if provided, otherwise let DB handle
    timestamp_creacion: nota.timestamp_creacion instanceof Date ? nota.timestamp_creacion.toISOString() : (typeof nota.timestamp_creacion === 'string' ? nota.timestamp_creacion : undefined),
  };

  const { data, error } = await supabase
    .from('notas')
    .insert([notaParaGuardar])
    .select()
    .single();

  if (error) {
    console.error('Error al insertar nota en Supabase:', error);
    throw error;
  }
  if (!data) {
     throw new Error('No se devolvieron datos después de la inserción de nota.');
  }

  return { // Corrected formatting
     ...data,
     id: data.id,
     registro_id: data.registro_id,
     user_id: data.user_id,
     texto: data.texto,
     autor: data.autor,
     privacidad: data.privacidad,
     timestamp_creacion: data.timestamp_creacion ? new Date(data.timestamp_creacion) : undefined, // Return as Date
     tipo_nota: data.tipo_nota,
  } as Nota;
}

// Función para obtener todas las notas asociadas a un registro por su ID
export async function fetchNotasByRegistro(registroId: string): Promise<Nota[]> {
  if (!supabase) {
     console.error("Cliente Supabase no disponible para obtener notas.");
     throw new Error("Fallo en la configuración del cliente Supabase.");
  }

  const { data, error } = await supabase
    .from('notas')
    .select('*')
    .eq('registro_id', registroId)
    .order('timestamp_creacion', { ascending: true });

  if (error) {
    console.error(`Error al obtener notas para el registro ${registroId}:`, error);
    throw error;
  }

  return data ? data.map(n => ({ // Corrected formatting
     ...n,
     id: n.id,
     registro_id: n.registro_id,
     user_id: n.user_id,
     texto: n.texto,
     autor: n.autor,
     privacidad: n.privacidad,
     timestamp_creacion: n.timestamp_creacion ? new Date(n.timestamp_creacion) : undefined, // Return as Date
     tipo_nota: n.tipo_nota,
  })) as Nota[] : [];
}


export async function fetchRegistros(): Promise<RegistroDeConciencia[]> {
  if (!supabase) {
    console.error("El cliente Supabase no está disponible en fetchRegistros.");
    throw new Error("Fallo en la configuración del cliente Supabase.");
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('Error obteniendo sesión:', sessionError);
    throw new Error('Error al obtener la sesión del usuario.');
  }
  if (!sessionData.session) {
    console.warn('Usuario no autenticado. No se pueden obtener los registros.');
    return [];
  }

  const userId = sessionData.session.user.id;

  const { data, error } = await supabase
    .from('registros_de_conciencia')
    .select('*')
    .eq('user_id', userId)
    .eq('estado', 'Realizado')
    .order('tiempo_inicio', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Error al obtener registros de Supabase:', error);
    throw error;
  }

  return data ? data.map(r => ({ // Corrected formatting
    ...r,
    id: r.id,
    user_id: r.user_id,
    descripcion: r.descripcion,
    estado: r.estado,
    timestamp_creacion: r.timestamp_creacion ? new Date(r.timestamp_creacion) : undefined, // Return as Date
    tiempo_inicio: r.tiempo_inicio ? new Date(r.tiempo_inicio) : null, // Return as Date
    tiempo_fin: r.tiempo_fin ? new Date(r.tiempo_fin) : null, // Return as Date
    notas_texto_simple: (r as any).notas_texto_simple, // This seems incorrect, should be r.notas_texto_simple if it existed
    foco_agentes: r.foco_agentes,
    etiquetas: r.etiquetas,
    lugar_texto_simple: r.lugar_texto_simple,
    duracion_estimada_minutos: r.duracion_estimada_minutos,
    sensacion_kinestesica: r.sensacion_kinestesica,
    prioridad: (r as any).prioridad, // Include priority in return type
  })) as RegistroDeConciencia[] : [];
}

// Add SortOption type
export type IntentionSortOption = 'chronological' | 'priority';

export async function fetchIntenciones(userId: string, sortBy: IntentionSortOption = 'chronological'): Promise<RegistroDeConciencia[]> {
  if (!supabase) {
    console.error("El cliente Supabase no está disponible en fetchIntenciones.");
    throw new Error("Fallo en la configuración del cliente Supabase.");
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session || sessionData.session.user.id !== userId) {
    throw new Error('Usuario no autenticado o ID no coincide. No se pueden obtener las intenciones.');
  }

  let query = supabase
    .from('registros_de_conciencia')
    .select('*')
    .eq('user_id', userId)
    .eq('estado', 'Planificado');

  // Apply sorting based on the sortBy parameter
  if (sortBy === 'priority') {
      // Sort by priority (descending), then by time_inicio (ascending), nulls last
      query = query
        .order('prioridad', { ascending: false, nullsFirst: false })
        .order('tiempo_inicio', { ascending: true, nullsFirst: false });
  } else { // Default to chronological
      // Sort by time_inicio (ascending), then by timestamp_creacion (ascending)
      query = query
        .order('tiempo_inicio', { ascending: true, nullsFirst: false })
        .order('timestamp_creacion', { ascending: true });
  }


  const { data, error } = await query;

  if (error) {
    console.error('Error al obtener intenciones de Supabase:', error);
    throw error;
  }

  return data ? data.map(r => ({ // Corrected formatting
    ...r,
    id: r.id,
    user_id: r.user_id,
    descripcion: r.descripcion,
    estado: r.estado,
    timestamp_creacion: r.timestamp_creacion ? new Date(r.timestamp_creacion) : undefined, // Return as Date
    tiempo_inicio: r.tiempo_inicio ? new Date(r.tiempo_inicio) : null, // Return as Date
    tiempo_fin: r.tiempo_fin ? new Date(r.tiempo_fin) : null, // Return as Date
    notas_texto_simple: (r as any).notas_texto_simple, // This seems incorrect, should be r.notas_texto_simple if it existed
    foco_agentes: r.foco_agentes,
    etiquetas: r.etiquetas,
    lugar_texto_simple: r.lugar_texto_simple,
    duracion_estimada_minutos: r.duracion_estimada_minutos,
    sensacion_kinestesica: r.sensacion_kinestesica,
    prioridad: (r as any).prioridad, // Include priority in return type
  })) as RegistroDeConciencia[] : [];
}

export async function updateRegistroStatus(registroId: string, newStatus: EstadoRegistro): Promise<RegistroDeConciencia> {
   if (!supabase) {
     console.error("El cliente Supabase no está disponible para actualizar estado.");
     throw new Error("Fallo en la configuración del cliente Supabase.");
   }

   const { data, error } = await supabase
     .from('registros_de_conciencia')
     .update({ estado: newStatus, tiempo_fin: (newStatus === 'Realizado' || newStatus === 'Adaptado / Saltado') ? new Date().toISOString() : undefined })
     .eq('id', registroId)
     .select()
     .single();

   if (error) {
     console.error(`Error al actualizar estado del registro ${registroId}:`, error);
     throw error;
   }

   if (!data) {
     throw new Error(`No se encontró el registro ${registroId} o no tienes permisos para actualizarlo.`);
   }

   return { // Corrected formatting
     ...data,
     id: data.id,
     user_id: data.user_id,
     descripcion: data.descripcion,
     estado: data.estado,
     timestamp_creacion: data.timestamp_creacion ? new Date(data.timestamp_creacion) : undefined, // Return as Date
     tiempo_inicio: data.tiempo_inicio ? new Date(data.tiempo_inicio) : null, // Return as Date
     tiempo_fin: data.tiempo_fin ? new Date(data.tiempo_fin) : null, // Return as Date
     notas_texto_simple: (data as any).notas_texto_simple, // This seems incorrect, should be data.notas_texto_simple if it existed
     foco_agentes: data.foco_agentes,
     etiquetas: data.etiquetas,
     lugar_texto_simple: data.lugar_texto_simple,
     duracion_estimada_minutos: data.duracion_estimada_minutos,
     sensacion_kinestesica: data.sensacion_kinestesica,
     prioridad: (data as any).prioridad, // Include priority in return type
   } as RegistroDeConciencia;
}

// Función para obtener todos los registros (Realizado o Planificado con tiempo) para una fecha específica
export async function fetchDailyRegistros(userId: string, date: Date): Promise<RegistroDeConciencia[]> {
  if (!supabase) {
    console.error("El cliente Supabase no está disponible en fetchDailyRegistros.");
    throw new Error("Fallo en la configuración del cliente Supabase.");
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session || sessionData.session.user.id !== userId) {
    throw new Error('Usuario no autenticado o ID no coincide. No se pueden obtener los registros diarios.');
  }

  // Calculate start and end of the day in ISO format
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('registros_de_conciencia')
    .select('*')
    .eq('user_id', userId)
    // Filter by tiempo_inicio within the date range
    .gte('tiempo_inicio', startOfDay.toISOString())
    .lte('tiempo_inicio', endOfDay.toISOString())
    // Only include records that have a planned or actual time range
    .not('tiempo_inicio', 'is', null)
    // Consider including 'Realizado' and 'Planificado' states that have time
    .in('estado', ['Realizado', 'Planificado'])
    .order('tiempo_inicio', { ascending: true }); // Order chronologically for timeline

  if (error) {
    console.error('Error al obtener registros diarios de Supabase:', error);
    throw error;
  }

  return data ? data.map(r => ({ // Corrected formatting
    ...r,
    id: r.id,
    user_id: r.user_id,
    descripcion: r.descripcion,
    estado: r.estado,
    timestamp_creacion: r.timestamp_creacion ? new Date(r.timestamp_creacion) : undefined, // Return as Date
    tiempo_inicio: r.tiempo_inicio ? new Date(r.tiempo_inicio) : null, // Return as Date
    tiempo_fin: r.tiempo_fin ? new Date(r.tiempo_fin) : null, // Return as Date
    notas_texto_simple: (r as any).notas_texto_simple, // This seems incorrect, should be r.notas_texto_simple if it existed
    foco_agentes: r.foco_agentes,
    etiquetas: r.etiquetas,
    lugar_texto_simple: r.lugar_texto_simple,
    duracion_estimada_minutos: r.duracion_estimada_minutos,
    sensacion_kinestesica: r.sensacion_kinestesica,
    prioridad: (r as any).prioridad, // Include priority in return type
  })) as RegistroDeConciencia[] : [];
}

// Función para obtener la consulta I Ching asociada a un registro por su ID
export async function fetchIChingByRegistro(registroId: string): Promise<any | null> {
  if (!supabase) {
     console.error("Cliente Supabase no disponible para obtener consulta I Ching.");
     throw new Error("Fallo en la configuración del cliente Supabase.");
  }

  const { data, error } = await supabase
    .from('iching_consultas')
    .select('*') // Select all fields for now
    .eq('registro_id', registroId)
    .single(); // Assuming one consultation per record

  if (error && error.code !== 'PGRST116') { // PGRST116 means 'no rows found'
    console.error(`Error al obtener consulta I Ching para el registro ${registroId}:`, error);
    throw error;
  }

  // If error is PGRST116, data will be null, which is correct for no consultation found
  return data;
}