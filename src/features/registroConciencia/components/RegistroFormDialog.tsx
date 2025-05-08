// src/features/registroConciencia/components/RegistroFormDialog.tsx
"use client";

import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/ui/form";
import { Input } from "../../../components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover";
import { Calendar } from "../../../components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn, formatFriendlyDate } from "../../../lib/utils";
import { Textarea } from "../../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

import { toast } from 'sonner'; // Correcta importación de sonner

import { RegistroDeConciencia, EstadoRegistro } from "../../../types/registro";
import { addRegistro } from "../services/registroService";

const formSchema = z.object({
  descripcion: z.string().min(1, { message: "La descripción es requerida." }),
  estado: z.enum(['Planificado', 'En Progreso', 'Realizado', 'Adaptado / Saltado']),
  tiempo_inicio: z.date().nullable().optional(),
  foco_agentes_texto_simple: z.string().nullable().optional(),
  etiquetas_texto_simple: z.string().nullable().optional(),
  notas_texto_simple: z.string().nullable().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface RegistroFormDialogProps {
  children: React.ReactNode;
  onRegistroGuardado?: () => void;
}

export function RegistroFormDialog({ children, onRegistroGuardado }: RegistroFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descripcion: "",
      estado: "Realizado" as EstadoRegistro,
      tiempo_inicio: null,
      foco_agentes_texto_simple: "",
      etiquetas_texto_simple: "",
      notas_texto_simple: "",
    },
  });

  const handleSetAhora = () => {
    const now = new Date();
    form.setValue("tiempo_inicio", now, { shouldValidate: true });
    // Corregido: Usar el primer argumento para el mensaje principal/título
    toast.success("Tiempo de inicio fijado a la hora actual.");
    // Si necesitas un subtítulo, usa la opción `description`:
    // toast.success("Tiempo Establecido", { description: "El inicio se fijó a la hora actual." });
  };

  async function onSubmit(values: FormData) {
    console.log("Formulario enviado:", values);
    const registroParaGuardar: Partial<RegistroDeConciencia> = { ...values };

    try {
      const nuevoRegistro = await addRegistro(registroParaGuardar);
      console.log("Registro guardado:", nuevoRegistro);
      // Corregido:
      toast.success("Momento de conciencia guardado correctamente.");
      // O si prefieres título y descripción:
      // toast.success("¡Éxito!", { description: "Momento de conciencia guardado correctamente." });
      setIsOpen(false);
      form.reset();
      if (onRegistroGuardado) {
        onRegistroGuardado();
      }
    } catch (error) {
      console.error("Error al guardar el registro:", error);
      // Corregido:
      const errorMessage = error instanceof Error ? error.message : "No se pudo guardar. Intenta de nuevo.";
      toast.error(errorMessage);
      // O si prefieres título y descripción:
      // toast.error("Error al Guardar", { description: errorMessage });
    }
  }

  const handleOpenChange = (openState: boolean) => {
    if (openState && !isOpen) {
      form.reset({
        descripcion: "",
        estado: "Realizado" as EstadoRegistro,
        tiempo_inicio: null,
        foco_agentes_texto_simple: "",
        etiquetas_texto_simple: "",
        notas_texto_simple: "",
      });
    }
    setIsOpen(openState);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px] bg-background">
        <DialogHeader>
          <DialogTitle>Añadir Momento de Conciencia</DialogTitle>
          <DialogDescription>
            Registra lo que fluye por tu conciencia. Completa los detalles a continuación.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* ... resto de los FormFields sin cambios ... */}
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="¿Qué fluye por tu conciencia?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Realizado">Realizado</SelectItem>
                      <SelectItem value="Planificado">Planificado</SelectItem>
                      <SelectItem value="En Progreso">En Progreso</SelectItem>
                      <SelectItem value="Adaptado / Saltado">Adaptado / Saltado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tiempo_inicio"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha y Hora de Inicio (Opcional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        type="button" 
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          formatFriendlyDate(field.value)
                        ) : (
                          <span>Selecciona una fecha y hora</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value instanceof Date ? field.value : (field.value ? new Date(field.value) : undefined)}
                        onSelect={(selectedDate) => {
                          if (selectedDate) {
                            const newDateTime = new Date(selectedDate);
                            const previousTime = field.value instanceof Date ? field.value : new Date();
                            
                            newDateTime.setHours(previousTime.getHours());
                            newDateTime.setMinutes(previousTime.getMinutes());
                            newDateTime.setSeconds(previousTime.getSeconds());
                            newDateTime.setMilliseconds(previousTime.getMilliseconds());

                            field.onChange(newDateTime);
                          } else {
                            field.onChange(null);
                          }
                        }}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="foco_agentes_texto_simple"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Foco / Agentes (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Yo, Perro, Libro..." {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="etiquetas_texto_simple"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etiquetas (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="#trabajo, #idea..." {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notas_texto_simple"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notas adicionales..." {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* ... fin de los FormFields ... */}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleSetAhora}>
                Ahora
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Guardando..." : "Guardar Registro"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}