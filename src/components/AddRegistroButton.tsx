import * as React from 'react';
import { Button } from "./ui/button"; 
import { PlusIcon } from "lucide-react"; 

interface AddRegistroButtonProps {
  onClick?: () => void; 
  
}

export function AddRegistroButton({ onClick }: AddRegistroButtonProps) {
  return (
    <Button variant="outline" size="icon" onClick={onClick}>
      <PlusIcon className="h-4 w-4" />
      <span className="sr-only">Añadir Registro</span>
    </Button>
  );
}