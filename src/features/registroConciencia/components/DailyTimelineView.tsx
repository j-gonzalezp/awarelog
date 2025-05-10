import React, { useEffect, useState } from 'react';
import { format, parseISO, differenceInMinutes, startOfDay, endOfDay, differenceInSeconds } from 'date-fns';
import { RegistroDeConciencia, PeriodoVacioAnotado } from '../../../types/registro';
import { fetchDailyRegistros } from '../services/coreRegistroService';
import { saveEmptyPeriodAnnotation } from '../services/dataManagementService';
import { useAuth } from '../../../contexts/AuthContext';
import AnnotateEmptyPeriodModal from './AnnotateEmptyPeriodModal';
import { toast } from 'sonner';

interface TimelineSegment {
  type: 'registro' | 'vacio';
  start: Date;
  end: Date;
  durationMinutes: number;
  registro?: RegistroDeConciencia;
}

interface DailyTimelineViewProps {
  date: Date;
  onAnnotationSaved?: () => void;
}

const DailyTimelineView: React.FC<DailyTimelineViewProps> = ({ date, onAnnotationSaved }) => {
  const { user } = useAuth();
  const [registros, setRegistros] = useState<RegistroDeConciencia[]>([]);
  const [timelineSegments, setTimelineSegments] = useState<TimelineSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmptySegment, setSelectedEmptySegment] = useState<TimelineSegment | null>(null);

  const loadDailyData = async () => {
    if (!user || !user.id) {
      setError("Usuario no autenticado.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      
      const fetchedRegistros = await fetchDailyRegistros(user.id, date);
      setRegistros(fetchedRegistros);

      
      const segments: TimelineSegment[] = [];
      const startOfCurrentDay = startOfDay(date);
      const endOfCurrentDay = endOfDay(date);
      let currentTime = startOfCurrentDay;

      
      const sortedRegistros = fetchedRegistros.sort((a, b) => {
          const timeA = a.tiempo_inicio ? new Date(a.tiempo_inicio).getTime() : 0;
          const timeB = b.tiempo_inicio ? new Date(b.tiempo_inicio).getTime() : 0;
          return timeA - timeB;
      });

      sortedRegistros.forEach(reg => {
          const regStartTime = reg.tiempo_inicio ? new Date(reg.tiempo_inicio) : null;
          const regEndTime = reg.tiempo_fin ? new Date(reg.tiempo_fin) : null;

          
          if (regStartTime && regEndTime && regStartTime < endOfCurrentDay && regEndTime > startOfCurrentDay) {
              const actualStartTime = regStartTime > startOfCurrentDay ? regStartTime : startOfCurrentDay;
              const actualEndTime = regEndTime < endOfCurrentDay ? regEndTime : endOfCurrentDay;

              
              if (currentTime < actualStartTime) {
                  segments.push({
                      type: 'vacio',
                      start: currentTime,
                      end: actualStartTime,
                      durationMinutes: differenceInMinutes(actualStartTime, currentTime),
                  });
              }

              
              segments.push({
                  type: 'registro',
                  start: actualStartTime,
                  end: actualEndTime,
                  durationMinutes: differenceInMinutes(actualEndTime, actualStartTime),
                  registro: reg,
              });

              
              currentTime = actualEndTime;
          }
      });

      
      if (currentTime < endOfCurrentDay) {
           segments.push({
              type: 'vacio',
              start: currentTime,
              end: endOfCurrentDay,
              durationMinutes: differenceInMinutes(endOfCurrentDay, currentTime),
          });
      }

      setTimelineSegments(segments);

    } catch (err) {
      console.error("Error loading daily data:", err);
      setError("Error al cargar los datos diarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDailyData();
    } else {
        setRegistros([]);
        setTimelineSegments([]);
        setLoading(false);
        setError("Debes iniciar sesión para ver la línea de tiempo.");
    }
  }, [date, user]);

  
  const totalEmptyMinutes = timelineSegments
    .filter(segment => segment.type === 'vacio')
    .reduce((total, segment) => total + segment.durationMinutes, 0);

  const formatDuration = (minutes: number): string => {
      if (minutes < 0) return "0 minutos";
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (hours > 0 && remainingMinutes > 0) {
          return `${hours} horas y ${remainingMinutes} minutos`;
      } else if (hours > 0) {
          return `${hours} horas`;
      } else {
          return `${remainingMinutes} minutos`;
      }
  };

  
  const handleEmptySegmentClick = (segment: TimelineSegment) => {
    if (segment.type === 'vacio') {
      setSelectedEmptySegment(segment);
      setIsModalOpen(true);
    }
  };

  
  const handleSaveAnnotation = async (annotationData: Omit<PeriodoVacioAnotado, 'id' | 'user_id' | 'timestamp_creacion' | 'duracion_segundos'>) => {
      if (!user || !user.id) {
          toast.error("Debes iniciar sesión para guardar la anotación.");
          return;
      }
      if (!selectedEmptySegment) {
          toast.error("No se seleccionó un periodo vacío.");
          return;
      }

      try {
          
          await saveEmptyPeriodAnnotation({
              fecha: selectedEmptySegment.start,
              hora_inicio: selectedEmptySegment.start,
              hora_fin: selectedEmptySegment.end,
              etiquetas: annotationData.etiquetas,
              nota: annotationData.nota,
          });
          toast.success("Anotación guardada exitosamente.");
          setIsModalOpen(false);
          setSelectedEmptySegment(null);
          
          
          if (onAnnotationSaved) {
            onAnnotationSaved();
          }
      } catch (error) {
          console.error("Error saving empty period annotation:", error);
          const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido al guardar la anotación.";
          toast.error(`Error al guardar anotación: ${errorMessage}`);
          
      }
  };

  
  if (loading) {
    return <div className="text-center">Cargando línea de tiempo...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  
  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-xl font-semibold mb-4">Línea de Tiempo Diaria - {format(date, 'PPP')}</h2>

      
      <p className="text-sm text-muted-foreground mb-4">
        Tiempo no registrado hoy: <strong>{formatDuration(totalEmptyMinutes)}</strong>
      </p>

      <div className="relative h-[960px] w-full border"> 
        
        {[...Array(25)].map((_, i) => (
            <div
                key={`hour-marker-${i}`}
                className="absolute left-0 right-0 border-t border-gray-200 text-xs text-gray-500"
                style={{ top: `${(i / 24) * 100}%` }}
            >
                <span className="absolute -left-8 top-[-0.5em]">{format(new Date(date).setHours(i, 0, 0, 0), 'HH:mm')}</span>
            </div>
        ))}

        
        {timelineSegments.map((segment, index) => {
            const segmentStart = segment.start;
            const segmentEnd = segment.end;
            const totalDayDuration = differenceInMinutes(endOfDay(date), startOfDay(date));
            let startOffsetMinutes = differenceInMinutes(segmentStart, startOfDay(date));
            let durationMinutes = differenceInMinutes(segmentEnd, segmentStart);

            
            if (startOffsetMinutes < 0) startOffsetMinutes = 0;
            if (startOffsetMinutes + durationMinutes > totalDayDuration) durationMinutes = totalDayDuration - startOffsetMinutes;


            const topPercentage = (startOffsetMinutes / totalDayDuration) * 100;
            const heightPercentage = (durationMinutes / totalDayDuration) * 100;

            
            const segmentStyle: React.CSSProperties = {
                position: 'absolute',
                top: `${topPercentage}%`,
                height: `${heightPercentage}%`,
                left: 0,
                right: 0,
                backgroundColor: segment.type === 'registro' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(209, 213, 219, 0.5)',
                borderLeft: `4px solid ${segment.type === 'registro' ? '#3b82f6' : '#9ca3af'}`,
                padding: '2px 8px',
                overflow: 'hidden',
                fontSize: '12px',
                cursor: segment.type === 'vacio' ? 'pointer' : 'default',
            };

            
            if (heightPercentage <= 0) return null;


            return (
                <div
                    key={index}
                    style={segmentStyle}
                    title={`${segment.type === 'registro' ? segment.registro?.descripcion : 'Tiempo Vacío'} (${formatDuration(segment.durationMinutes)})`}
                    
                    onClick={() => segment.type === 'vacio' && handleEmptySegmentClick(segment)}
                >
                    
                    {segment.type === 'registro' ? (
                        <div>
                            <p className="font-semibold">{segment.registro?.descripcion}</p>
                            <p className="text-xs">{format(segment.start, 'HH:mm')} - {format(segment.end, 'HH:mm')}</p>
                        </div>
                    ) : (
                         <div className="text-gray-700">
                            <p>Vacío</p>
                            <p className="text-xs">{format(segment.start, 'HH:mm')} - {format(segment.end, 'HH:mm')}</p>
                         </div>
                    )}
                </div>
            );
        })}
      </div>

      
      {selectedEmptySegment && (
          <AnnotateEmptyPeriodModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSave={handleSaveAnnotation}
              emptyPeriodStart={selectedEmptySegment.start}
              emptyPeriodEnd={selectedEmptySegment.end}
          />
      )}
    </div>
  );
};

export default DailyTimelineView;