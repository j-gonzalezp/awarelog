// src/components/AddRegistroButton.tsx
import * as React from 'react';
import { Button } from "./ui/button"; // Asumiendo que esta es la ruta correcta para tu botón Shadcn
import { PlusIcon } from "lucide-react"; // Asumiendo que tienes lucide-react instalado

interface AddRegistroButtonProps {
  onClick?: () => void; // Para conectar con el DialogTrigger o un estado manual
  // Podríamos pasar otras props de Button si es necesario
}

export function AddRegistroButton({ onClick }: AddRegistroButtonProps) {
  return (
    <Button variant="outline" size="icon" onClick={onClick}>
      <PlusIcon className="h-4 w-4" />
      <span className="sr-only">Añadir Registro</span>
    </Button>
  );
}

// Nota: Si este botón SIEMPRE va a ser un DialogTrigger,
// podríamos considerar que acepte `children` y envolverlos
// con el botón, o que directamente sea parte del Dialog component.
// Por ahora, lo mantenemos simple con un onClick.
// Si se usa directamente como trigger de Shadcn Dialog, el onClick no sería necesario
// ya que DialogTrigger maneja eso.
// <DialogTrigger asChild><AddRegistroButton /></DialogTrigger> sería el uso.
// En ese caso, el onClick prop puede eliminarse. Vamos a quitarlo por ahora
// asumiendo que se usará con `asChild`.

// Versión revisada para usar con <DialogTrigger asChild>:
// src/components/AddRegistroButton.tsx
// import { Button } from "@/components/ui/button";
// import { PlusIcon } from \"lucide-react\";

// export function AddRegistroButton() {
//   return (
//     <Button variant="outline" size="icon">
//       <PlusIcon className="h-4 w-4" />
//       <span className="sr-only">Añadir Registro</span>
//     </Button>
//   );
// }
// La primera versión con onClick es más flexible si no se usa con DialogTrigger asChild.
// Mantendré la primera versión con onClick por si se decide controlar la apertura del diálogo manualmente.
// Si se usa con <DialogTrigger asChild>, el onClick simplemente no se pasará.