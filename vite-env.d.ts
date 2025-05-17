interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_KEY: string;
    // Añade aquí cualquier otra variable de entorno que uses con VITE_
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}