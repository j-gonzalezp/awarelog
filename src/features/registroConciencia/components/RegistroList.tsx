// src/features/registroConciencia/components/RegistroList.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { RegistroDeConciencia } from '../../../types/registro';
// Updated import path for fetchRegistros
import { fetchRegistros } from '../services/coreRegistroService';
import { RegistroItem } from './RegistroItem';
import { AddNoteDialog } from './AddNoteDialog'; // ADDED AddNoteDialog import
// import { Skeleton } from "@/components/ui/skeleton"; // Para un estado de carga más visual

interface RegistroListProps {
  refresher?: number;
  triggerGlobalRefresh?: () => void; // Added this prop based on AppLayout's plan
}

export function RegistroList({ refresher, triggerGlobalRefresh }: RegistroListProps) { // Accepted triggerGlobalRefresh
  const [registros, setRegistros] = useState<RegistroDeConciencia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteDialogState, setNoteDialogState] = useState<{ isOpen: boolean; registroId: string | null }>({ isOpen: false, registroId: null }); // ADDED state for note dialog

  const cargarRegistros = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchRegistros();
      setRegistros(data);
    } catch (err) {
      console.error("Error al cargar registros:", err);
      setError(err instanceof Error ? err.message : "Ocurrió un error desconocido.");
    } finally {
      setIsLoading(false);
    }
  };

  // ADDED function to open the note dialog
  const handleOpenNoteDialog = (registroId: string) => {
    setNoteDialogState({ isOpen: true, registroId: registroId });
  };

  // ADDED function to close the note dialog
  const handleCloseNoteDialog = (open: boolean) => {
     if (!open) { // Cuando se cierra el diálogo
       setNoteDialogState({ isOpen: false, registroId: null }); // Limpiar el estado
       // Opcional: Si quieres recargar la lista principal de registros cuando se añade una nota (aunque no se muestren aquí)
       // cargarRegistros(); // Llama a la función que carga la lista principal
       // if (triggerGlobalRefresh) { triggerGlobalRefresh(); } // Also call global refresh if needed
     }
     // If you need to do something specific when a note *was successfully* added (e.g. if using onNoteAdded prop of AddNoteDialog),
     // you might handle that logic differently, maybe in a callback passed to onNoteAdded.
  };


  useEffect(() => {
    cargarRegistros();
  }, [refresher, triggerGlobalRefresh]); // Added triggerGlobalRefresh to dependency array

  if (isLoading) {
    return (
      <div className="space-y-4">
        <p>Cargando momentos de conciencia...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">
        <p>Error al cargar los registros: {error}</p>
        <button onClick={cargarRegistros} className="mt-2 p-2 border rounded">Reintentar</button>
      </div>
    );
  }

  if (registros.length === 0) {
    return <p>Aún no has registrado ningún momento de conciencia "Realizado". ¡Empieza ahora!</p>;
  }

  return (
    <div className="space-y-6">
      {registros.map((registro) => (
        <RegistroItem
          key={registro.id}
          registro={registro}
          onAddNote={registro.id ? () => handleOpenNoteDialog(registro.id!) : undefined} // Pass the function, ensure ID exists
          // showStatusActions={...} // You can pass these if you want status actions on history items
          // onStatusChange={...}    // You would pass your own handler here
        />
      ))}

      {/* ADDED AddNoteDialog component */}
      {noteDialogState.isOpen && (
        <AddNoteDialog
          isOpen={noteDialogState.isOpen}
          onOpenChange={handleCloseNoteDialog}
          registroId={noteDialogState.registroId}
          // onNoteAdded={(notaGuardada) => { console.log("Nota guardada:", notaGuardada); cargarRegistros(); }} // Example to refresh after note added
        />
      )}
    </div>
  );
}