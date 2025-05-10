// src/features/registroConciencia/components/RegistroItem.tsx
import React, { useEffect, useState } from 'react';
import { RegistroDeConciencia, EstadoRegistro, Nota } from "../../../types/registro";
// Updated import path for fetchNotasByRegistro
import { fetchNotasByRegistro } from '../services/coreRegistroService';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { formatFriendlyDate } from "../../../lib/utils"; // Corrected import path
import { BookOpen, Loader2, AlertCircle } from 'lucide-react'; // Added AlertCircle
import { cn } from "../../../lib/utils"; // Import cn utility

interface RegistroItemProps {
  registro: RegistroDeConciencia;
  showStatusActions?: boolean;
  onStatusChange?: (newStatus: EstadoRegistro) => void;
  onAddNote?: (registroId: string) => void;
  // Added props for Mentor Focused Intention (User Story 5.8)
  isFocusedByMentor?: boolean;
  mentorMessage?: string;
}

export function RegistroItem({
  registro,
  showStatusActions = false,
  onStatusChange,
  onAddNote,
  isFocusedByMentor = false, // Default to false
  mentorMessage,
}: RegistroItemProps) {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [isLoadingNotas, setIsLoadingNotas] = useState<boolean>(false);
  const [notasError, setNotasError] = useState<string | null>(null); // Added notasError state

  useEffect(() => {
    if (registro.id) {
      setIsLoadingNotas(true);
      setNotasError(null); // Clear previous errors
      fetchNotasByRegistro(registro.id)
        .then(data => {
          setNotas(data);
          setNotasError(null); // Clear error on success
        })
        .catch(err => {
          console.error("Error fetching notes for item:", registro.id, err);
          setNotasError("Error al cargar las notas."); // Set error state
          setNotas([]); // Clear notes on error
        })
        .finally(() => setIsLoadingNotas(false));
    } else {
      setNotas([]);
      setNotasError(null); // Clear error if no registro.id
    }
  }, [registro.id]);

  const shouldRenderFooter = (showStatusActions && onStatusChange) || onAddNote;

  const notasProspectivas = notas.filter(n => n.tipo_nota === 'Prospectiva');
  const notasRetrospectivas = notas.filter(n => n.tipo_nota === 'Retrospectiva');

  // Helper to format note timestamp (basic string format) - Moved inside component if it uses component scope things, or keep outside if pure
  const formatNoteTimestamp = (date?: Date) => {
      if (!date) return 'Fecha no disponible';
      const formatter = new Intl.DateTimeFormat('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
      });
      return formatter.format(date);
  };


  return (
    <Card className={cn("mb-4", isFocusedByMentor && 'border-primary-foreground border-2 shadow-md')}> {/* Apply conditional styling */}
      <CardHeader>
        <CardTitle>{registro.descripcion || "Sin descripción"}</CardTitle> {/* Corrected CardTitle JSX */}
        <CardDescription>
          Registrado: {formatFriendlyDate(registro.tiempo_inicio || registro.timestamp_creacion)}
          {registro.estado && ` - Estado: ${registro.estado}`}
        </CardDescription>
        {/* Display Mentor Message if focused (User Story 5.8) */}
        {isFocusedByMentor && mentorMessage && (
            <p className="text-sm text-primary-foreground mt-2 p-2 bg-primary rounded-md">Mensaje del Mentor: {mentorMessage}</p>
        )}
      </CardHeader>
      <CardContent>
        {registro.sensacion_kinestesica && (
           <div className="mb-2">
             <p className="text-sm font-semibold">Sensación/Emoción:</p>
             <p className="text-sm text-muted-foreground">{registro.sensacion_kinestesica}</p>
           </div>
        )}

        {registro.foco_agentes && registro.foco_agentes.length > 0 && (
          <div className="mb-2">
            <p className="text-sm font-semibold">Foco/Agentes:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {registro.foco_agentes.map(agent => (
                <Badge key={agent} variant="outline" className="text-xs">
                  {agent}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {registro.etiquetas && registro.etiquetas.length > 0 && (
          <div className="mb-2">
            <p className="text-sm font-semibold">Etiquetas:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {registro.etiquetas.map(etiqueta => (
                <Badge key={etiqueta} variant="secondary" className="text-xs">
                  {etiqueta}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {registro.lugar_texto_simple && (
          <div className="mb-2">
            <p className="text-sm font-semibold">Lugar:</p>
            <p className="text-sm text-muted-foreground">{registro.lugar_texto_simple}</p>
          </div>
        )}

        {(registro.duracion_estimada_minutos !== null && registro.duracion_estimada_minutos !== undefined) && (
           <div className="mb-2">
             <p className="text-sm font-semibold">Duración Estimada:</p>
             <p className="text-sm text-muted-foreground">{registro.duracion_estimada_minutos} minutos</p>
           </div>
        )}

        {/* Display associated Notes */}
        {isLoadingNotas ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
             <Loader2 className="h-4 w-4 animate-spin" /> Cargando notas...
          </div>
        ) : notasError ? ( // Display error message if notasError is not null
           <div className="flex items-center gap-2 text-destructive text-sm">
             <AlertCircle className="h-4 w-4" /> {notasError}
           </div>
        ) : notas.length > 0 && (
          <div className="mb-2">
            <p className="text-sm font-semibold mb-1">Notas:</p>

            {/* Display Prospectiva notes */}
            {notasProspectivas.length > 0 && (
              <div className="mb-2 pl-2 border-l border-primary/50"> {/* Simple visual distinction */}
                 <p className="text-xs font-medium text-muted-foreground">Notas Prospectivas:</p>
                 {notasProspectivas.map(nota => (
                   <div key={nota.id} className="text-sm text-muted-foreground mt-1">
                     <span className="font-semibold text-foreground">{nota.autor || 'Autor Desconocido'}:</span> {nota.texto}
                     <span className="text-xs text-gray-500 ml-2">{nota.timestamp_creacion ? formatNoteTimestamp(nota.timestamp_creacion) : ''}</span> {/* Display timestamp */}
                   </div>
                 ))}
              </div>
            )}

            {/* Display Retrospectiva notes */}
             {notasRetrospectivas.length > 0 && (
              <div className="mb-2 pl-2 border-l border-secondary/50"> {/* Simple visual distinction */}
                 <p className="text-xs font-medium text-muted-foreground">Notas Retrospectivas:</p>
                 {notasRetrospectivas.map(nota => (
                   <div key={nota.id} className="text-sm text-muted-foreground mt-1">
                      <span className="font-semibold text-foreground">{nota.autor || 'Autor Desconocido'}:</span> {nota.texto}
                       <span className="text-xs text-gray-500 ml-2">{nota.timestamp_creacion ? formatNoteTimestamp(nota.timestamp_creacion) : ''}</span> {/* Display timestamp */}
                   </div>
                 ))}
              </div>
            )}

             {/* If there are notes but none are typed Prospectiva or Retrospectiva */}
            {(notas.length > 0 && notasProspectivas.length === 0 && notasRetrospectivas.length === 0) && (
                <div className="text-sm text-muted-foreground italic">Notas encontradas sin tipo específico.</div>
            )}

          </div>
        )}


      </CardContent>

      {shouldRenderFooter && (
        <CardFooter className="flex justify-end pt-4">
          <div className="flex flex-wrap items-center gap-2">

            {showStatusActions && onStatusChange && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStatusChange('Realizado')}
                  type="button"
                >
                  Realizado
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStatusChange('Adaptado / Saltado')}
                  type="button"
                >
                  Saltado
                </Button>
              </div>
            )}

            {onAddNote && registro.id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddNote(registro.id!)}
                type="button"
              >
                <BookOpen className="w-4 h-4 mr-1" />
                Añadir Nota
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}