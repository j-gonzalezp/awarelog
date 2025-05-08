// src/features/registroConciencia/components/RegistroList.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { RegistroDeConciencia } from '../../../types/registro';
import { fetchRegistros } from '../services/registroService';
import { RegistroItem } from './RegistroItem';
// import { Skeleton } from "@/components/ui/skeleton"; // Para un estado de carga más visual

interface RegistroListProps {
  // Podríamos pasar un `key` o `refresher` si necesitamos forzar la recarga desde fuera
  refresher?: number; 
}

export function RegistroList({ refresher }: RegistroListProps) {
  const [registros, setRegistros] = useState<RegistroDeConciencia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    cargarRegistros();
  }, [refresher]); // Recargar si el `refresher` cambia

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Ejemplo de Skeletons, necesitarías instalar y configurar `shadcn-ui add skeleton` */}
        {/* <Skeleton className="h-24 w-full" />
        <Skeleton className=\"h-24 w-full\" />
        <Skeleton className=\"h-24 w-full\" /> */}
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
        <RegistroItem key={registro.id} registro={registro} />
      ))}
    </div>
  );
}