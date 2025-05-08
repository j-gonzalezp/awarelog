interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_KEY: string;
    // Añade aquí cualquier otra variable de entorno que uses con VITE_
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  type CustomComponents = {
    // ... other components
    IconLeft: React.ComponentType<IconLeftProps>; // Or similar signature
    IconRight: React.ComponentType<IconRightProps>;
    // ...
}