/** Backend base URL. Empty = same origin (Vite proxy in dev). */
const BACKEND = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

/** REST API base — same as backend URL, or same-origin when empty. */
export const API_BASE = BACKEND;

/** Socket.io URL — same as backend; empty uses same-origin via Vite proxy. */
export const SOCKET_URL = BACKEND || undefined;

/** Optional AWS API Gateway WebSocket (legacy). Empty = Socket.io. */
export const WS_URL = import.meta.env.VITE_WS_URL || "";
