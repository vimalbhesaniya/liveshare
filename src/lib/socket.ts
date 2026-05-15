import { io } from "socket.io-client";
import { SOCKET_URL } from "./config";

export type RealtimeLike = {
  readonly connected: boolean;
  connect(): void;
  disconnect(): void;
  emit(action: string, payload: Record<string, unknown>): void;
  on(event: string, handler: (data: Record<string, unknown>) => void): void;
  off(event: string, handler: (data: Record<string, unknown>) => void): void;
};

/** Socket.io adapter for local development (when VITE_WS_URL is empty). */
export function createSocketIoClient(): RealtimeLike {
  const socket = io(SOCKET_URL, {
    autoConnect: true,
    transports: ["websocket", "polling"],
  });

  return {
    get connected() {
      return socket.connected;
    },
    connect() {
      if (!socket.connected) socket.connect();
    },
    disconnect() {
      socket.disconnect();
    },
    emit(action, payload) {
      socket.emit(action, payload);
    },
    on(event, handler) {
      socket.on(event, handler);
    },
    off(event, handler) {
      socket.off(event, handler);
    },
  };
}
