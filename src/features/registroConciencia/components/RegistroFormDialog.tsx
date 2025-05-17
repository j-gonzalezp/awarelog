// src/features/registroConciencia/components/RegistroFormDialog.tsx
// "use client"; // Removed

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
import { Checkbox } from "../../../components/ui/checkbox";
import { TagsInput } from '../../../components/ui/tags-input';
import { CalendarIcon } from "lucide-react";
import { cn, formatFriendlyDate } from "../../../lib/utils";
import { es } from 'date-fns/locale';
import { Textarea } from "../../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

import { toast } from 'sonner';

import { RegistroDeConciencia, EstadoRegistro } from "../../../types/registro";
// Updated import path for addRegistro
import { addRegistro, addNota } from "../services/coreRegistroService";

const formSchema = z.object({
  descripcion: z.string().min(1, { message: "La descripción es requerida." }),
  estado: z.enum(['Planificado', 'En Progreso', 'Realizado', 'Adaptado / Saltado']),
  tiempo_inicio: z.date().nullable().optional(),
  foco_agentes: z.array(z.string()).nullable().optional(),
  etiquetas: z.array(z.string()).nullable().optional(),
  lugar_texto_simple: z.string().nullable().optional(),
  duracion_estimada_minutos: z.number().int().nullable().optional(),
  sin_tiempo_especifico: z.boolean().optional(),
  sensacion_kinestesica: z.string().nullable().optional(), // ADDED
  prioridad: z.number().int().nullable().optional().refine(val => val === null || (typeof val === 'number' && val >= 0 && val <= 10), { // Adjusted refinement
    message: "La prioridad debe ser un número entero entre 0 y 10.",
  }),
  notas_prospectivas: z.string().nullable().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface RegistroFormDialogProps {
  children: React.ReactNode;
  onRegistroGuardado?: () => void;
}

export function RegistroFormDialog({ children, onRegistroGuardado }: RegistroFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Added isSubmitting state

  const form = useForm<FormData>({ // Corrected formatting around this call
    resolver: zodResolver(formSchema),
    defaultValues: {
      descripcion: "",
      estado: "Realizado" as EstadoRegistro,
      tiempo_inicio: null,
      foco_agentes: [],
      etiquetas: [],
      lugar_texto_simple: "",
      duracion_estimada_minutos: null,
      sin_tiempo_especifico: false,
      sensacion_kinestesica: "",
      prioridad: null, // Reset priority on open
      notas_prospectivas: "",
    },
  });

  const sinTiempoEspecificoWatched = form.watch("sin_tiempo_especifico");
  const estadoWatched = form.watch("estado"); // Watch the estado field

  React.useEffect(() => {
    const sinTiempoMarcado = form.getValues("sin_tiempo_especifico");
    if (sinTiempoMarcado) {
      form.setValue("tiempo_inicio", null, { shouldValidate: true });
    }
  }, [form.watch("sin_tiempo_especifico"), form]);

  const handleSetAhora = () => {
    if (sinTiempoEspecificoWatched) return;
    const now = new Date();
    form.setValue("tiempo_inicio", now, { shouldValidate: true });
    toast.success("Tiempo de inicio fijado a la hora actual.");
  };

  async function onSubmit(values: FormData) {
    console.log("Formulario enviado:", values);
    setIsSubmitting(true);

    // 1. Prepare and save the main record (without prospective notes)
    const registroParaGuardar: Partial<RegistroDeConciencia> = {
      descripcion: values.descripcion,
      estado: values.estado,
      tiempo_inicio: values.tiempo_inicio,
      foco_agentes: (values.foco_agentes && values.foco_agentes.length > 0) ? values.foco_agentes : null,
      etiquetas: (values.etiquetas && values.etiquetas.length > 0) ? values.etiquetas : null,
      lugar_texto_simple: values.lugar_texto_simple || null,
      duracion_estimada_minutos: values.duracion_estimada_minutos === undefined || values.duracion_estimada_minutos === null ? null : Number(values.duracion_estimada_minutos),
      sensacion_kinestesica: values.sensacion_kinestesica || null,
      prioridad: values.estado === 'Planificado' ? values.prioridad : null,
      // notas_prospectivas is NOT part of RegistroDeConciencia directly
    };

    try {
      const nuevoRegistro = await addRegistro(registroParaGuardar);
      console.log("Registro guardado:", nuevoRegistro);
      let mainToastMessage = "Momento de conciencia guardado.";

      // 2. If prospective note exists, save it using addNota
      if (values.notas_prospectivas && values.notas_prospectivas.trim() !== "" && nuevoRegistro.id) {
        try {
          await addNota({
            registro_id: nuevoRegistro.id,
            texto: values.notas_prospectivas.trim(),
            tipo_nota: 'Prospectiva',
            autor: 'Yo', // Default author, adjust if needed
            privacidad: 'Privada' // Default privacy, adjust if needed
          });
          mainToastMessage += " Y nota prospectiva guardada.";
        } catch (notaError) {
          console.error("Error al guardar la nota prospectiva:", notaError);
          toast.error("El registro se guardó, pero falló al guardar la nota prospectiva.");
          // Continue to show success for the main record if only note failed
        }
      }
      
      toast.success(mainToastMessage);
      setIsOpen(false);
      form.reset(); // This will also reset notas_prospectivas in the form
      if (onRegistroGuardado) {
        onRegistroGuardado();
      }
    } catch (error) {
      console.error("Error al guardar el registro principal:", error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo guardar el registro. Intenta de nuevo.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleOpenChange = (openState: boolean) => {
    if (openState && !isOpen) {
      form.reset({
        descripcion: "",
        estado: "Realizado" as EstadoRegistro,
        tiempo_inicio: null,
        foco_agentes: [],
        etiquetas: [],
        lugar_texto_simple: "",
        duracion_estimada_minutos: null,
        sin_tiempo_especifico: false,
        sensacion_kinestesica: "",
        prioridad: null, // Reset priority on open
        notas_prospectivas: "",
      });
       setIsSubmitting(false); // Also reset submitting state on open
    }
    setIsOpen(openState);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px] bg-background">
        <DialogHeader>
          <DialogTitle>Añadir Momento de Conciencia</DialogTitle> {/* Updated title */}
          <DialogDescription>
            Registra lo que fluye por tu conciencia. Completa los detalles a continuación.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
              name="notas_prospectivas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Prospectivas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Añade notas para el futuro sobre esta intención..."
                      {...field}
                      value={field.value ?? ""}
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

            {/* Priority Field (Visible only if Estado is Planificado) */}
            {estadoWatched === 'Planificado' && (
              <FormField
                control={form.control}
                name="prioridad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ej: 5 (0-10)"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            field.onChange(null);
                          } else {
                            const num = parseInt(value, 10);
                            field.onChange(isNaN(num) ? null : num);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="sin_tiempo_especifico"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 pt-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="sin_tiempo_especifico"
                    />
                  </FormControl>
                  <FormLabel htmlFor="sin_tiempo_especifico" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Sin tiempo específico
                  </FormLabel>
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
                        disabled={sinTiempoEspecificoWatched || isSubmitting}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground",
                          sinTiempoEspecificoWatched && "opacity-50 cursor-not-allowed"
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
                          date < new Date("1900-01-01") // Allow future dates
                        }
                        locale={es} // Add Spanish locale
                        initialFocus
                        captionLayout="dropdown-buttons" // Improve navigation
                        fromYear={new Date().getFullYear() - 10} // Example: 10 years back
                        toYear={new Date().getFullYear() + 10}   // Example: 10 years forward
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lugar_texto_simple"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lugar (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Oficina, Casa..." {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duracion_estimada_minutos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duración Estimada (minutos) (Opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Ej: 30" 
                      {...field} 
                      value={field.value ?? ""} 
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          field.onChange(null);
                        } else {
                          const num = parseInt(value, 10);
                          field.onChange(isNaN(num) ? null : num);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sensacion_kinestesica"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sensación / Emoción (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Calma, Estresado, Curioso..." {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="foco_agentes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Foco / Agentes (Opcional)</FormLabel>
                  <FormControl>
                    <TagsInput
                      placeholder="Yo, Perro, Libro..."
                      value={field.value ?? []}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="etiquetas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etiquetas (Opcional)</FormLabel>
                  <FormControl>
                    <TagsInput
                      placeholder="#trabajo, #idea..."
                      value={field.value ?? []}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleSetAhora}
                disabled={sinTiempoEspecificoWatched || isSubmitting}
              >
                Ahora
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Registro"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RegistroFormDialog;