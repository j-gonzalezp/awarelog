"use client";

import * as React from 'react';
import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Textarea } from '../../../components/ui/textarea';
import { toast } from 'sonner';
import { Nota } from '../../../types/registro';
import { addNota } from '../services/coreRegistroService';

interface AddNoteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  registroId: string | null;
  onNoteAdded?: (nota: Nota) => void;
}

export function AddNoteDialog({ isOpen, onOpenChange, registroId, onNoteAdded }: AddNoteDialogProps) {
  const [noteText, setNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setNoteText('');
      setIsSaving(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!registroId) {
      console.error("Attempted to save note without a registroId");
      toast.error("Error interno: ID de registro no disponible.");
      return;
    }
    if (noteText.trim() === '') {
      toast.warning("La nota no puede estar vacía.");
      return;
    }

    setIsSaving(true);
    const nuevaNotaData: Partial<Nota> = {
      registro_id: registroId,
      texto: noteText.trim(),
      tipo_nota: 'Retrospectiva',
    };

    try {
      const notaGuardada = await addNota(nuevaNotaData);
      toast.success("Nota guardada correctamente.");
      onOpenChange(false);
      if (onNoteAdded) {
        onNoteAdded(notaGuardada);
      }
    } catch (error) {
      console.error("Error al guardar nota:", error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo guardar la nota. Intenta de nuevo.";
      toast.error(errorMessage);
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen && registroId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Nota Retrospectiva</DialogTitle>

        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Escribe tu nota retrospectiva aquí..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={4}
            disabled={isSaving}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar Nota"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}