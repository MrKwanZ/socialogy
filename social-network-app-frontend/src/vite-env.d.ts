/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend origin, e.g. `http://localhost:8080` (no trailing slash required). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
