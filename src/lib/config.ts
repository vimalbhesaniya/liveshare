/** Backend base URL. Empty = same origin (Vite proxy in dev, Nginx in prod). */
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(
  /\/$/,
  "",
);

export const API_BASE = import.meta.env.VITE_API_URL ?? BACKEND_URL;

/** Socket.io URL for local dev (empty = same origin via Vite proxy). */
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined;

/** AWS API Gateway WebSocket URL — set after `serverless deploy`. */
export const WS_URL = import.meta.env.VITE_WS_URL || "";
