"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';

import { PeriodoVacioAnotado } from '../../../types/registro';

import { addNota } from '../services/coreRegistroService';

interface AnnotateEmptyPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (annotation: Omit<PeriodoVacioAnotado, 'id' | 'user_id' | 'timestamp_creacion' | 'duracion_segundos'>) => Promise<void>;
  emptyPeriodStart: Date | null;
  emptyPeriodEnd: Date | null;
}

const AnnotateEmptyPeriodModal: React.FC<AnnotateEmptyPeriodModalProps> = ({
  isOpen,
  onClose,
  onSave,
  emptyPeriodStart,
  emptyPeriodEnd,
}) => {
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTags([]);
      setNote('');
    }
  }, [isOpen, emptyPeriodStart, emptyPeriodEnd]);

  const handleSave = async () => {
    if (!emptyPeriodStart || !emptyPeriodEnd) {

      console.error("Empty period times are not set.");
      onClose();
      return;
    }

    setIsSaving(true);
    try {

      const annotationData = {
        fecha: emptyPeriodStart,
        hora_inicio: emptyPeriodStart,
        hora_fin: emptyPeriodEnd,
        etiquetas: tags.length > 0 ? tags : null,
        nota: note.trim() !== '' ? note.trim() : null,
      };
      await onSave(annotationData);
      onClose();
    } catch (error) {
      console.error("Error saving empty period annotation:", error);

    } finally {
      setIsSaving(false);
    }
  };


  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const inputTags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    setTags(inputTags);
  };

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-xl font-semibold mb-4">Anotar Periodo Vacío</h2>
        {emptyPeriodStart && emptyPeriodEnd && (
          <p className="text-sm text-muted-foreground mb-4">
            De {format(emptyPeriodStart, 'HH:mm')} a {format(emptyPeriodEnd, 'HH:mm')}
          </p>
        )}

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="tags">Etiquetas (separadas por coma)</Label>
            <Input
              id="tags"
              value={tags.join(', ')}
              onChange={handleTagInputChange}
              placeholder="ej: #Descanso, #Hiperfoco"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">Nota</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Añade un contexto o significado a este periodo..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Anotación'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnnotateEmptyPeriodModal;