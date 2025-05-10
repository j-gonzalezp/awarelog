
import supabase from '../../../assets/supabase/client'; // <--- ¡AJUSTA ESTA RUTA!
import { RegistroDeConciencia, Nota, ImportResult, Insight, PeriodoVacioAnotado } from '../../../types/registro'; // Import necessary types
import { differenceInSeconds } from 'date-fns/differenceInSeconds';
import { fetchNotasByRegistro, fetchIChingByRegistro } from './coreRegistroService'; // Import functions from core service

// Define a basic schema for imported data structure (can be more detailed with Zod)
interface ImportedRegistroData extends RegistroDeConciencia {
    notas?: Nota[];
}

interface ExportOptions {
    startDate?: Date;
    endDate?: Date;
    includeEmptyPeriods?: boolean; // Added option for User Story 5.5
}

// Define interface for Mentor Suggestion (User Story 5.8)
interface MentorFocusedIntention {
    registro_id: string;
    mensaje_opcional?: string;
}

// Key for local storage
const MENTOR_SUGGESTION_STORAGE_KEY = 'mentorFocusedIntention';


export async function exportUserRegistros(userId: string, options?: ExportOptions): Promise<string> {
    if (!supabase) {
        console.error("Cliente Supabase no disponible para exportar datos.");
        throw new Error("Fallo en la configuración del cliente Supabase.");
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session || sessionData.session.user.id !== userId) {
        throw new Error('Usuario no autenticado o ID no coincide. No se pueden exportar los datos.');
    }

    // 1. Fetch Registros de Conciencia
    let registrosQuery = supabase
        .from('registros_de_conciencia')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp_creacion', { ascending: false });

    if (options?.startDate) {
        registrosQuery = registrosQuery.gte('timestamp_creacion', options.startDate.toISOString());
    }
    if (options?.endDate) {
        registrosQuery = registrosQuery.lte('timestamp_creacion', options.endDate.toISOString());
    }

    const { data: registrosData, error: registrosError } = await registrosQuery;

    if (registrosError) {
        console.error('Error al obtener registros para exportación de Supabase:', registrosError);
        throw registrosError;
    }

    const exportData: any[] = []; // Use any[] for flexibility to add other data types

    if (registrosData) {
        for (const reg of registrosData) {
            // Use imported functions from coreRegistroService
            const notas = await fetchNotasByRegistro(reg.id);
            const ichingConsulta = await fetchIChingByRegistro(reg.id);

            exportData.push({
                ...reg,
                timestamp_creacion: reg.timestamp_creacion ? new Date(reg.timestamp_creacion).toISOString() : undefined,
                tiempo_inicio: reg.tiempo_inicio ? new Date(reg.tiempo_inicio).toISOString() : null,
                tiempo_fin: reg.tiempo_fin ? new Date(reg.tiempo_fin).toISOString() : null,
                notas: notas.map(n => ({
                    ...n,
                    timestamp_creacion: n.timestamp_creacion ? new Date(n.timestamp_creacion).toISOString() : undefined,
                })),
                iching_consulta: ichingConsulta,
            });
        }
    }

    // 2. Fetch Annotated Empty Periods if option is enabled (User Story 5.5)
    if (options?.includeEmptyPeriods) {
        let emptyPeriodsQuery = supabase
            .from('periodos_vacio_anotado')
            .select('*')
            .eq('user_id', userId)
            .order('fecha', { ascending: false }) // Order by date
            .order('hora_inicio', { ascending: false }); // Then by start time

        // Filter by date range (using the 'fecha' column)
        if (options?.startDate) {
             // Need to adjust start date to the beginning of the day for filtering by 'fecha'
             const startOfDayISO = new Date(options.startDate).toISOString().split('T')[0];
             emptyPeriodsQuery = emptyPeriodsQuery.gte('fecha', startOfDayISO);
        }
        if (options?.endDate) {
             // Need to adjust end date to the end of the day for filtering by 'fecha'
             const endOfDayISO = new Date(options.endDate).toISOString().split('T')[0];
             emptyPeriodsQuery = emptyPeriodsQuery.lte('fecha', endOfDayISO);
        }


        const { data: emptyPeriodsData, error: emptyPeriodsError } = await emptyPeriodsQuery;

        if (emptyPeriodsError) {
            console.error('Error al obtener anotaciones de periodos vacíos para exportación:', emptyPeriodsError);
            // Decide whether to throw or continue without empty periods; let's continue
        }

        if (emptyPeriodsData && emptyPeriodsData.length > 0) {
            // Add annotated empty periods as a separate section
            // Format dates to ISO strings for consistency
            const formattedEmptyPeriods = emptyPeriodsData.map(p => ({
                ...p,
                fecha: p.fecha, // Assuming fecha is already date string or can be used as is
                hora_inicio: new Date(p.hora_inicio).toISOString(),
                hora_fin: new Date(p.hora_fin).toISOString(),
                timestamp_creacion: p.timestamp_creacion ? new Date(p.timestamp_creacion).toISOString() : undefined,
            }));
            // Add to the main export data structure, perhaps as a key outside the main array
            // Or wrap the main array in an object? Let's wrap in an object for clarity.
            // Modify the return structure to be { registros: [...], anotaciones_vacio: [...] }
             return JSON.stringify({
                 registros: exportData,
                 anotaciones_vacio: formattedEmptyPeriods
             }, null, 2);
        }
    }

    // If not including empty periods or none found, just return the records array
    return JSON.stringify(exportData, null, 2);
}

// --- Part 2: Implement JSON Import ---

export async function importMentorData(jsonData: any): Promise<ImportResult> {
    if (!supabase) {
        console.error("Cliente Supabase no disponible para importar datos.");
        throw new Error("Fallo en la configuración del cliente Supabase.");
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
        throw new Error('Usuario no autenticado. No se pueden importar los datos.');
    }
    const userId = sessionData.session.user.id;

    let notasAgregadas = 0;
    let registrosSugeridos = 0;
    let mentorSuggestionProcessed = false; // Track if suggestion was found and processed

    // Basic validation: Check if jsonData is an array or object with 'registros' key
    let recordsToImport: ImportedRegistroData[] = [];
    // let emptyPeriodsToImport: PeriodoVacioAnotado[] = []; // Assuming import might include empty periods later

    if (Array.isArray(jsonData)) {
        // Old format: just an array of records
        recordsToImport = jsonData as ImportedRegistroData[];
    } else if (typeof jsonData === 'object' && jsonData !== null) {
        // New format: object with keys like 'registros', 'anotaciones_vacio', 'sugerencia_enfoque_semanal'
        if (Array.isArray(jsonData.registros)) {
            recordsToImport = jsonData.registros as ImportedRegistroData[];
        }

        // Handle Mentor Suggestion (User Story 5.8)
        if (jsonData.sugerencia_enfoque_semanal && typeof jsonData.sugerencia_enfoque_semanal === 'object') {
            const suggestion = jsonData.sugerencia_enfoque_semanal as MentorFocusedIntention;
            if (suggestion.registro_id) {
                // Store the suggestion in local storage
                try {
                    localStorage.setItem(MENTOR_SUGGESTION_STORAGE_KEY, JSON.stringify(suggestion));
                    console.log("Mentor suggestion stored:", suggestion);
                    mentorSuggestionProcessed = true;
                } catch (storageError) {
                    console.error("Error storing mentor suggestion in local storage:", storageError);
                    // Continue without storing if local storage fails
                }
            } else {
                 console.warn("Mentor suggestion found but missing registro_id:", suggestion);
            }
        }


        // TODO: Handle importing empty period annotations if needed in a future sprint
        // if (Array.isArray(jsonData.anotaciones_vacio)) {
        //     emptyPeriodsToImport = jsonData.anotaciones_vacio as PeriodoVacioAnotado[];
        // }
    } else {
         throw new Error('Formato de datos JSON inválido. Se esperaba un array o un objeto con clave \"registros\".');
    }


    for (const importedReg of recordsToImport) {
        // Basic validation for imported record structure
        if (!importedReg.id || !importedReg.descripcion || !importedReg.estado) {
            console.warn('Saltando registro importado con estructura inválida:', importedReg);
            continue; // Skip invalid records
        }

        try {
            // 1. Try to find the local record by imported ID
            const { data: localReg, error: fetchError } = await supabase
                .from('registros_de_conciencia')
                .select('id')
                .eq('id', importedReg.id)
                .eq('user_id', userId) // Ensure it belongs to the current user
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means 'no rows found'
                console.error(`Error fetching local record ${importedReg.id}:`, fetchError);
                // Decide whether to throw or continue; continuing allows importing other records
                continue;
            }

            if (localReg) {
                // Record exists locally, import mentor notes
                if (Array.isArray(importedReg.notas)) {
                    for (const importedNota of importedReg.notas) {
                        // Basic validation for imported note structure
                        if (!importedNota.texto || !importedNota.autor) {
                             console.warn('Saltando nota importada con estructura inválida:', importedNota);
                             continue; // Skip invalid notes
                        }

                        // Only import notes authored by 'Mentor'
                        if (importedNota.autor === 'Mentor') {
                            // Check for duplicates (optional but good practice)
                            // This requires fetching existing notes for the record and comparing text/author
                            // For simplicity now, we'll just insert. A unique constraint on (registro_id, texto, autor) in DB is better.
                            const { data: existingNotes, error: existingNotesError } = await supabase
                                .from('notas')
                                .select('id')
                                .eq('registro_id', localReg.id)
                                .eq('user_id', userId)
                                .eq('texto', importedNota.texto)
                                .eq('autor', 'Mentor');

                            if (existingNotesError) {
                                console.error('Error checking for existing mentor notes:', existingNotesError);
                                continue; // Skip adding this note if check fails
                            }

                            if (!existingNotes || existingNotes.length === 0) {
                                // Note doesn't exist, insert it
                                const notePayload = {
                                    registro_id: localReg.id,
                                    user_id: userId,
                                    texto: importedNota.texto,
                                    autor: 'Mentor', // Ensure author is 'Mentor'
                                    privacidad: importedNota.privacidad || 'Privada', // Use imported privacy or default
                                    // Use imported timestamp if available, otherwise let DB set it
                                    timestamp_creacion: importedNota.timestamp_creacion ? new Date(importedNota.timestamp_creacion).toISOString() : undefined,
                                    tipo_nota: importedNota.tipo_nota, // Use imported type if available
                                };

                                const { error: insertNoteError } = await supabase
                                    .from('notas')
                                    .insert([notePayload]);

                                if (insertNoteError) {
                                    console.error('Error inserting mentor note:', insertNoteError);
                                } else {
                                    notasAgregadas++;
                                }
                            } else {
                                // console.log('Skipping duplicate mentor note:', importedNota.texto);
                            }
                        }
                    }
                }
            } else {
                // Record does NOT exist locally, create it as a suggestion
                console.log(`Local record with ID ${importedReg.id} not found. Creating as suggested record.`);

                const newRegistroPayload = {
                    ...importedReg, // Copy imported data
                    id: undefined, // Let Supabase generate a new ID
                    user_id: userId, // Assign to current user
                    // Ensure date fields are correctly formatted for DB
                    timestamp_creacion: importedReg.timestamp_creacion ? new Date(importedReg.timestamp_creacion).toISOString() : undefined,
                    tiempo_inicio: importedReg.tiempo_inicio ? new Date(importedReg.tiempo_inicio).toISOString() : null,
                    tiempo_fin: importedReg.tiempo_fin ? new Date(importedReg.tiempo_fin).toISOString() : null,
                    // Optional: Add a tag or mark it as suggested
                    etiquetas: importedReg.etiquetas ? [...importedReg.etiquetas, '#SugerenciaMentor'] : ['#SugerenciaMentor'],
                };

                const { data: newRegData, error: insertRegError } = await supabase
                    .from('registros_de_conciencia')
                    .insert([newRegistroPayload])
                    .select()
                    .single();

                if (insertRegError) {
                    console.error('Error inserting suggested record:', insertRegError);
                } else if (newRegData) {
                    registrosSugeridos++;

                    // Insert associated notes for the new record
                    if (Array.isArray(importedReg.notas)) {
                         for (const importedNota of importedReg.notas) {
                            if (!importedNota.texto || !importedNota.autor) {
                                console.warn('Saltando nota importada con estructura inválida para nuevo registro:', importedNota);
                                continue;
                            }
                            const notePayload = {
                                registro_id: newRegData.id, // Link to the newly created record ID
                                user_id: userId,
                                texto: importedNota.texto,
                                autor: importedNota.autor, // Keep original author for suggested records
                                privacidad: importedNota.privacidad || 'Privada',
                                timestamp_creacion: importedNota.timestamp_creacion ? new Date(importedNota.timestamp_creacion).toISOString() : undefined,
                                tipo_nota: importedNota.tipo_nota,
                            };
                             const { error: insertNoteError } = await supabase
                                .from('notas')
                                .insert([notePayload]);

                            if (insertNoteError) {
                                console.error('Error inserting note for suggested record:', insertNoteError);
                            } else {
                                // Count notes added to new records as part of suggested records count?\n                                // Or maybe a separate count? The plan says 'notasAgregadas' for mentor notes,
                                // let's stick to that and only count mentor notes added to *existing* records.
                                // Notes added to *new* suggested records are part of the suggestion.
                            }
                         }
                    }
                }
            }
        } catch (error) {
            console.error(`Error processing imported record ${importedReg.id}:`, error);
            // Continue processing other records even if one fails
        }
    }

    return {
        notasAgregadas,
        registrosSugeridos,
    };
}

// Función para guardar una anotación de periodo vacío (User Story 5.4)
export async function saveEmptyPeriodAnnotation(annotation: {
    fecha: Date;
    hora_inicio: Date;
    hora_fin: Date;
    etiquetas?: string[] | null;
    nota?: string | null;
}): Promise<PeriodoVacioAnotado> {
    if (!supabase) {
        console.error("Cliente Supabase no disponible para guardar anotación de vacío.");
        throw new Error("Fallo en la configuración del cliente Supabase.");
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
        throw new Error('Usuario no autenticado. No se puede guardar la anotación de vacío.');
    }
    const userId = sessionData.session.user.id;

    // Calculate duration in seconds
    const duracion_segundos = differenceInSeconds(annotation.hora_fin, annotation.hora_inicio);

    const annotationPayload = {
        user_id: userId,
        fecha: annotation.fecha.toISOString().split('T')[0], // Store date only
        hora_inicio: annotation.hora_inicio.toISOString(),
        hora_fin: annotation.hora_fin.toISOString(),
        duracion_segundos: duracion_segundos,
        etiquetas: annotation.etiquetas || null,
        nota: annotation.nota || null,
        // timestamp_creacion will be set by the database
    };

    const { data, error } = await supabase
        .from('periodos_vacio_anotado')
        .insert([annotationPayload])
        .select()
        .single();

    if (error) {
        console.error('Error al insertar anotación de vacío en Supabase:', error);
        throw error;
    }

    if (!data) {
        throw new Error('No se devolvieron datos después de la inserción de anotación de vacío.');
    }

    // Return the saved annotation data, converting dates back to Date objects
    return {
        ...data,
        fecha: new Date(data.fecha),
        hora_inicio: new Date(data.hora_inicio),
        hora_fin: new Date(data.hora_fin),
        timestamp_creacion: data.timestamp_creacion ? new Date(data.timestamp_creacion) : undefined,
    } as PeriodoVacioAnotado;
}

// Función para obtener anotaciones de periodos vacíos por rango de fechas (User Story 5.5)
export async function fetchEmptyPeriodAnnotations(userId: string, options?: { startDate?: Date; endDate?: Date; }): Promise<PeriodoVacioAnotado[]> {
    if (!supabase) {
        console.error("Cliente Supabase no disponible para obtener anotaciones de vacío.");
        throw new Error("Fallo en la configuración del cliente Supabase.");
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session || sessionData.session.user.id !== userId) {
        throw new Error('Usuario no autenticado o ID no coincide. No se pueden obtener las anotaciones de vacío.');
    }

    let query = supabase
        .from('periodos_vacio_anotado')
        .select('*')
        .eq('user_id', userId)
        .order('fecha', { ascending: false })
        .order('hora_inicio', { ascending: false });

    // Filter by date range (using the 'fecha' column)
    if (options?.startDate) {
         const startOfDayISO = new Date(options.startDate).toISOString().split('T')[0];
         query = query.gte('fecha', startOfDayISO);
    }
    if (options?.endDate) {
         const endOfDayISO = new Date(options.endDate).toISOString().split('T')[0];
         query = query.lte('fecha', endOfDayISO);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error al obtener anotaciones de periodos vacíos de Supabase:', error);
        throw error;
    }

    // Convert date strings back to Date objects
    return data ? data.map(p => ({
        ...p,
        fecha: new Date(p.fecha),
        hora_inicio: new Date(p.hora_inicio),
        hora_fin: new Date(p.hora_fin),
        timestamp_creacion: p.timestamp_creacion ? new Date(p.timestamp_creacion) : undefined,
    })) as PeriodoVacioAnotado[] : [];
}


// --- Part 3: Implement System Suggestions (Version 1) ---

// Define Insight interface (already done in types/registro.ts)
// export interface Insight { ... }

export async function analyzeRecentPatterns(userId: string): Promise<Insight[]> {
    if (!supabase) {
        console.error("Cliente Supabase no disponible para análisis de patrones.");
        throw new Error("Fallo en la configuración del cliente Supabase.");
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session || sessionData.session.user.id !== userId) {
        throw new Error('Usuario no autenticado o ID no coincide. No se pueden analizar los datos.');
    }

    const insights: Insight[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    // 1. Fetch recent records (last 30 days)
    const { data: recentRegistros, error: fetchError } = await supabase
        .from('registros_de_conciencia')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp_creacion', thirtyDaysAgo.toISOString());

    if (fetchError) {
        console.error('Error fetching recent records for analysis:', fetchError);
        // Continue with empty data rather than throwing, so other insights might still work
    }

    const registros = recentRegistros || [];

    // Simple Analysis Logic:

    // 2. Identify planned records that were not completed (still 'Planificado')
    const uncompletedPlanned = registros.filter(reg =>
        reg.estado === 'Planificado' &&
        reg.tiempo_inicio && // Must have a planned start time
        new Date(reg.tiempo_inicio) < new Date() // Planned start time is in the past
    );

    if (uncompletedPlanned.length > 0) {
        insights.push({
            id: `uncompleted-planned-${Date.now()}`, // Simple unique ID
            type: 'void', // Using 'void' type for uncompleted items
            message: `Tienes ${uncompletedPlanned.length} registros planificados que no se han completado. ¿Necesitas ajustarlos o revisarlos?`,
            // Optionally link to the first one or list them
            relatedRegistroId: uncompletedPlanned[0].id,
        });
    }

    // 3. Identify frequently used agents/tags (simple count)
    const agentTagCounts: { [key: string]: number } = {};
    registros.forEach(reg => {
        if (reg.foco_agentes) {
            reg.foco_agentes.forEach(agent => {
                agentTagCounts[agent] = (agentTagCounts[agent] || 0) + 1;
            });
        }
        if (reg.etiquetas) {
             reg.etiquetas.forEach(tag => {
                agentTagCounts[tag] = (agentTagCounts[tag] || 0) + 1;
            });
        }
    });

    const frequentItems = Object.entries(agentTagCounts)
        .filter(([item, count]) => count > 5) // Threshold: appears more than 5 times in the last 30 days
        .sort(([, countA], [, countB]) => countB - countA); // Sort by frequency

    if (frequentItems.length > 0) {
        const message = `Parece que has interactuado mucho con: ${frequentItems.map(([item, count]) => `${item} (${count})`).join(', ')}. ¿Hay algún patrón aquí?`;
        insights.push({
            id: `frequent-items-${Date.now()}`, // Simple unique ID
            type: 'pattern', // Using 'pattern' type
            message: message,
        });
    }

    // Add more analysis logic here as needed (e.g., frequent sensations with specific agents)

    return insights;
}

// Function to retrieve mentor focused intention from local storage (User Story 5.8)
export function getMentorFocusedIntention(): MentorFocusedIntention | null {
    try {
        const stored = localStorage.getItem(MENTOR_SUGGESTION_STORAGE_KEY);
        if (stored) {
            const suggestion = JSON.parse(stored);
            // Basic validation
            if (suggestion && typeof suggestion === 'object' && typeof suggestion.registro_id === 'string') {
                return suggestion as MentorFocusedIntention;
            }
        }
    } catch (error) {
        console.error("Error retrieving mentor suggestion from local storage:", error);
    }
    return null;
}

// Function to clear mentor focused intention from local storage (Optional, but good practice)
export function clearMentorFocusedIntention() {
    try {
        localStorage.removeItem(MENTOR_SUGGESTION_STORAGE_KEY);
        console.log("Mentor suggestion cleared from local storage.");
    } catch (error) {
        console.error("Error clearing mentor suggestion from local storage:", error);
    }
}