/// <reference types="vite/client" />

declare module "*?worker" {
  const WorkerFactory: new () => Worker;
  export default WorkerFactory;
}

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_WS_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_SOCKET_URL?: string;
  readonly VITE_EMAILJS_SERVICE_ID?: string;
  readonly VITE_EMAILJS_TEMPLATE_ID?: string;
  readonly VITE_EMAILJS_PUBLIC_KEY?: string;
  readonly VITE_MAINTENANCE_MODE?: string;
  readonly VITE_MAINTENANCE_MESSAGE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
