// src/pages/HomePage.tsx
"use client"; // Necesario para hooks y interactividad

import React, { useState } from 'react';
import { AddRegistroButton } from '../components/AddRegistroButton';
import { RegistroFormDialog } from '../features/registroConciencia/components/RegistroFormDialog';
import { RegistroList } from '../features/registroConciencia/components/RegistroList';
// import { Toaster } from \"@/components/ui/toaster\"; // Asegúrate de tener Toaster en tu layout principal o aquí

export default function HomePage() {
  const [listRefresher, setListRefresher] = useState(0);

  const handleRegistroGuardado = () => {
    setListRefresher(prev => prev + 1); // Cambia el valor para disparar useEffect en RegistroList
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mis Momentos de Conciencia</h1>
        <p className="text-muted-foreground">
          Un espacio para registrar y reflexionar sobre el flujo de tu conciencia.
        </p>
      </header>

      <div className="mb-8 flex justify-end">
        <RegistroFormDialog onRegistroGuardado={handleRegistroGuardado}>
          <AddRegistroButton /> 
          {/* AddRegistroButton actúa como el DialogTrigger gracias a `asChild` en DialogTrigger */}
        </RegistroFormDialog>
      </div>

      <main>
        <h2 className="text-2xl font-semibold mb-6">Historial de Momentos Realizados</h2>
        <RegistroList refresher={listRefresher} />
      </main>
      
      {/* 
        Asegúrate de que <Toaster /> está presente en tu aplicación, 
        usualmente en el archivo de layout principal (ej. src/app/layout.tsx o similar si usas Next.js App Router,
        o en tu componente App principal si es una SPA Vite estándar).
        Si no está globalmente, puedes añadirlo aquí temporalmente para pruebas,
        pero es mejor tenerlo en un nivel superior.
      */}
      {/* <Toaster /> */}
    </div>
  );
}