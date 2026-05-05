/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EMAILJS_SERVICE_ID?: string;
  readonly VITE_EMAILJS_TEMPLATE_ID?: string;
  readonly VITE_EMAILJS_PUBLIC_KEY?: string;
  readonly VITE_MAINTENANCE_MODE?: string;
  readonly VITE_MAINTENANCE_MESSAGE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
