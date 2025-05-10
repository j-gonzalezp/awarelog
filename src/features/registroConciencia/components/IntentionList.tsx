// src/features/registroConciencia/components/IntentionList.tsx
// "use client"; // Removed

import React, { useEffect, useState } from 'react';
import { RegistroDeConciencia, EstadoRegistro } from '../../../types/registro';
// Updated import paths for service functions
import { fetchIntenciones, updateRegistroStatus, IntentionSortOption } from '../services/coreRegistroService'; // Import IntentionSortOption
import { getMentorFocusedIntention } from '../services/dataManagementService'; // Import function to get mentor suggestion
import { RegistroItem } from './RegistroItem';
import { AddNoteDialog } from './AddNoteDialog'; // Import AddNoteDialog
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button'; // Import Button for sorting controls

interface IntentionListProps {
  refresher?: number;
  onIntentionUpdated?: () => void;
  triggerGlobalRefresh?: () => void;
}

// Define interface for Mentor Suggestion (should match the one in dataManagementService)
interface MentorFocusedIntention {
    registro_id: string;
    mensaje_opcional?: string;
}


export function IntentionList({ refresher, onIntentionUpdated, triggerGlobalRefresh }: IntentionListProps) {
  const [intenciones, setIntenciones] = useState<RegistroDeConciencia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | Error | null>(null); // Allow error to be string, Error, or null
  // State for sorting preference (User Story 5.7)
  const [sortBy, setSortBy] = useState<IntentionSortOption>('chronological');
  // State for mentor focused intention (User Story 5.8)
  const [mentorFocusedIntention, setMentorFocusedIntention] = useState<MentorFocusedIntention | null>(null);


  // State for the note dialog
  const [noteDialogState, setNoteDialogState] = useState<{ isOpen: boolean; registroId: string | null }>({ isOpen: false, registroId: null });

  const cargarIntenciones = async (currentSortBy: IntentionSortOption) => { // Accept sort parameter
    setIsLoading(true);
    setError(null);
    try {
      // Pass the sort parameter to fetchIntenciones
      // Assuming userId is available from context or props if needed by fetchIntenciones
      const data = await fetchIntenciones(undefined as any, currentSortBy); // Replace undefined as any with actual userId if needed
      setIntenciones(data);
    } catch (err) {
      console.error("Error al cargar intenciones:", err);
      // Set error state based on the type of error
      setError(err instanceof Error ? err : (typeof err === 'string' ? err : "Ocurrió un error desconocido al cargar intenciones."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemStatusChange = async (registroId: string, newStatus: EstadoRegistro) => {
    const toastId = `update-${registroId}`;
    toast.loading("Actualizando intención...", { id: toastId });

    try {
      await updateRegistroStatus(registroId, newStatus);
      toast.success("Intención actualizada correctamente.", { id: toastId });
      
      // Reload intentions after update, maintaining current sort
      cargarIntenciones(sortBy);
      if (onIntentionUpdated) {
        onIntentionUpdated();
      }
      if (triggerGlobalRefresh) {
        triggerGlobalRefresh();
      }

    } catch (err) {
      console.error(`Error al actualizar estado de intención ${registroId}:`, err);
      const errorMessage = err instanceof Error ? err.message : "No se pudo actualizar la intención.";
      toast.error(errorMessage, { id: toastId });
    }
  };

  // Function to open the note dialog
  const handleOpenNoteDialog = (registroId: string) => {
    setNoteDialogState({ isOpen: true, registroId: registroId });
  };

  // Function to close the note dialog
  const handleCloseNoteDialog = (open: boolean) => {
     if (!open) { // When the dialog is closed
       setNoteDialogState({ isOpen: false, registroId: null }); // Clear the state
       // Optional: If you want to refresh after adding a note, you might call cargarIntenciones() here
       // or handle it in the onNoteAdded callback of AddNoteDialog.
     }
  };

  // Effect to load intentions when refresher, global refresh, or sort order changes
  useEffect(() => {
    cargarIntenciones(sortBy); // Call with current sort preference
  }, [refresher, triggerGlobalRefresh, sortBy]); // Add sortBy to dependencies

  // Effect to load mentor focused intention from local storage on mount (User Story 5.8)
  useEffect(() => {
    const suggestion = getMentorFocusedIntention();
    setMentorFocusedIntention(suggestion);
  }, []); // Empty dependency array means this runs once on mount


  if (isLoading) {
    return <p>Cargando intenciones...</p>;
  }

  if (error) {
    // Safely display the error message
    const errorMessage = error instanceof Error ? error.message : (typeof error === 'string' ? error : "Ocurrió un error desconocido.");
    return (
      <div className="text-red-500">
        <p>Error al cargar las intenciones: {errorMessage}</p>
        <button 
          onClick={() => cargarIntenciones(sortBy)} // Retry with current sort
          className="mt-2 p-2 border rounded bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (intenciones.length === 0) {
    return <p>Aún no tienes intenciones "Planificado".</p>;
  }

  return (
    <div className="space-y-6">
      {/* Sorting Controls (User Story 5.7) */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-medium">Ordenar por:</span>
        <Button 
          variant={sortBy === 'chronological' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('chronological')}
        >
          Fecha/Hora
        </Button>
        <Button 
          variant={sortBy === 'priority' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('priority')}
        >
          Prioridad
        </Button>
      </div>

      {intenciones.map((intencion) => (
        <RegistroItem
          key={intencion.id}
          registro={intencion}
          showStatusActions={true}
          onStatusChange={(newStatus) => {
            if (intencion.id) {
              handleItemStatusChange(intencion.id, newStatus);
            } else {
              console.error("Intention ID is undefined, cannot update status.");
              toast.error("No se pudo actualizar la intención: ID faltante.");
            }
          }}
          onAddNote={intencion.id ? () => handleOpenNoteDialog(intencion.id!) : undefined}
          // Pass highlighting props (User Story 5.8)
          isFocusedByMentor={mentorFocusedIntention?.registro_id === intencion.id}
          mentorMessage={mentorFocusedIntention?.registro_id === intencion.id ? mentorFocusedIntention.mensaje_opcional : undefined}
        />
      ))}

      {/* AddNoteDialog component */}
      {noteDialogState.isOpen && (
        <AddNoteDialog
          isOpen={noteDialogState.isOpen}
          onOpenChange={handleCloseNoteDialog}
          registroId={noteDialogState.registroId}
          // You can pass onNoteAdded here if you want to do something with the note after it's saved
          // onNoteAdded={(notaGuardada) => { console.log("Note saved:", notaGuardada); cargarIntenciones(sortBy); }}
        />
      )}
    </div>
  );
};

export default IntentionList;