// src/features/registroConciencia/components/RegistroItem.tsx
import React from 'react';
import { RegistroDeConciencia } from "../../../types/registro";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { formatFriendlyDate } from "../../../lib/utils"; // Importar la función de formateo

interface RegistroItemProps {
  registro: RegistroDeConciencia;
}

export function RegistroItem({ registro }: RegistroItemProps) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{registro.descripcion || "Sin descripción"}</CardTitle>
        <CardDescription>
          Registrado: {formatFriendlyDate(registro.tiempo_inicio || registro.timestamp_creacion)}
          {registro.estado && ` - Estado: ${registro.estado}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {registro.notas_texto_simple && (
          <div className="mb-2">
            <p className="text-sm font-semibold">Notas:</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {registro.notas_texto_simple}
            </p>
          </div>
        )}
        {registro.foco_agentes_texto_simple && (
          <div className="mb-2">
            <p className="text-sm font-semibold">Foco/Agentes:</p>
            <p className="text-sm text-muted-foreground">
              {registro.foco_agentes_texto_simple}
            </p>
          </div>
        )}
      </CardContent>
      {registro.etiquetas_texto_simple && (
        <CardFooter>
          <div>
            <p className="text-sm font-semibold">Etiquetas:</p>
            <p className="text-sm text-muted-foreground">
              {registro.etiquetas_texto_simple}
            </p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}