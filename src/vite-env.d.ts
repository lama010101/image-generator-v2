/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RUNWARE_API_KEY?: string;
  // add other env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
