// src/components/ui/toaster.tsx (o donde tengas tu componente Toaster)
import * as React from "react";
import { useTheme } from "next-themes"
import { Toaster as SonnerPrimitive, type ToasterProps } from "sonner" // Renombré a SonnerPrimitive para evitar conflicto

const Toaster = ({ ...props }: ToasterProps) => { // Tu Toaster personalizado
  const { theme = "system" } = useTheme()

  return (
    <SonnerPrimitive // Usa el SonnerPrimitive importado
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // Tus estilos CSS personalizados ya están aquí, ¡genial!
      // style={
      //   {
      //     "--normal-bg": "var(--popover)",
      //     "--normal-text": "var(--popover-foreground)",
      //     "--normal-border": "var(--border)",
      //   } as React.CSSProperties
      // }
      // Para que los estilos de sonner funcionen bien con las variables CSS de Shadcn,
      // es común pasarle las clases de Tailwind directamente o confiar en sus estilos por defecto
      // que se alinean con las variables CSS si están definidas globalmente.
      // Considera usar las props de `toastOptions` para estilizar si es necesario
      // o aplicar clases directamente aquí.
      // Ejemplo de clases para que se parezca más a Shadcn:
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          error: 'group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground group-[.toaster]:border-destructive',
          success: 'group-[.toaster]:bg-emerald-500 group-[.toaster]:text-white group-[.toaster]:border-emerald-500', // Ejemplo de color para success
          warning: 'group-[.toaster]:bg-amber-500 group-[.toaster]:text-white group-[.toaster]:border-amber-500', // Ejemplo para warning
        },
      }}
      {...props}
    />
  )
}

export { Toaster }