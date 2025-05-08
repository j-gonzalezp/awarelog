// Importa el cliente Supabase configurado desde tu archivo client.ts
// Ajusta la ruta relativa según la ubicación real de tu client.ts
// Por ejemplo, si client.ts está en src/lib/supabaseClient.ts y este archivo
// está en src/features/registroConciencia/services/registroService.ts,
// la ruta sería: ../../../lib/supabaseClient
import supabase from '../../../assets/supabase/client'; // <--- ¡AJUSTA ESTA RUTA!

import { RegistroDeConciencia } from '../../../types/registro';

// Ya no necesitamos inicializar Supabase aquí, lo importamos directamente.

export async function addRegistro(registro: Partial<RegistroDeConciencia>): Promise<RegistroDeConciencia> {
  // Verificar si el cliente Supabase se importó correctamente (opcional, pero bueno para depurar)
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

  // Construir el objeto a insertar.
  // Los campos 'id' y 'timestamp_creacion' son generados por la BD o tienen defaults.
  const registroParaGuardar = {
    descripcion: registro.descripcion!, // Asumimos validez por el formulario
    estado: registro.estado!,         // Asumimos validez por el formulario
    user_id: userId,
    tiempo_inicio: registro.tiempo_inicio instanceof Date ? registro.tiempo_inicio.toISOString() : (registro.tiempo_inicio || new Date().toISOString()),
    tiempo_fin: registro.tiempo_fin instanceof Date ? registro.tiempo_fin.toISOString() : (registro.tiempo_fin || null),
    notas_texto_simple: registro.notas_texto_simple || null,
    foco_agentes_texto_simple: registro.foco_agentes_texto_simple || null,
    etiquetas_texto_simple: registro.etiquetas_texto_simple || null,
    lugar_texto_simple: registro.lugar_texto_simple || null,
    duracion_estimada_minutos: registro.duracion_estimada_minutos || null,
  };

  const { data, error } = await supabase
    .from('registros_de_conciencia')
    .insert([registroParaGuardar])
    .select()
    .single(); // Usamos .single() porque esperamos un solo registro de vuelta

  if (error) {
    console.error('Error al insertar en Supabase:', error);
    throw error;
  }

  if (!data) {
    console.error('No se devolvieron datos después de la inserción.');
    throw new Error('No se devolvieron datos después de la inserción.');
  }

  // Convertir las fechas de string a Date antes de devolver
  return {
    ...data,
    timestamp_creacion: data.timestamp_creacion ? new Date(data.timestamp_creacion) : undefined,
    tiempo_inicio: data.tiempo_inicio ? new Date(data.tiempo_inicio) : null,
    tiempo_fin: data.tiempo_fin ? new Date(data.tiempo_fin) : null,
  } as RegistroDeConciencia;
}

export async function fetchRegistros(): Promise<RegistroDeConciencia[]> {
  // Verificar si el cliente Supabase se importó correctamente (opcional)
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

  return data ? data.map(r => ({
    ...r,
    timestamp_creacion: r.timestamp_creacion ? new Date(r.timestamp_creacion) : undefined,
    tiempo_inicio: r.tiempo_inicio ? new Date(r.tiempo_inicio) : null,
    tiempo_fin: r.tiempo_fin ? new Date(r.tiempo_fin) : null,
  })) as RegistroDeConciencia[] : [];
}