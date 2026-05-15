import { WS_URL } from "./config";
import { createSocketIoClient, type RealtimeLike } from "./socket";

type Handler = (data: Record<string, unknown>) => void;

class AwsRealtimeClient implements RealtimeLike {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<Handler>>();
  private url: string;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;

  constructor(url: string) {
    this.url = url;
  }

  get connected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      this.dispatch("connect", {});
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as Record<string, unknown>;
        const eventName = msg.event as string;
        if (eventName) this.dispatch(eventName, msg);
      } catch (err) {
        console.error("WebSocket message parse error:", err);
      }
    };

    this.ws.onclose = () => {
      this.dispatch("disconnect", {});
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.dispatch("error", {});
    };
  }

  private scheduleReconnect() {
    if (!this.shouldReconnect || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.ws = null;
      this.connect();
    }, 2000);
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  emit(action: string, payload: Record<string, unknown>) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ action, ...payload }));
  }

  on(event: string, handler: Handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler: Handler) {
    this.handlers.get(event)?.delete(handler);
  }

  private dispatch(event: string, data: Record<string, unknown>) {
    this.handlers.get(event)?.forEach((h) => h(data));
  }
}

let client: RealtimeLike | null = null;

/** AWS WebSocket (serverless) or Socket.io (local dev). */
export function getRealtime(): RealtimeLike {
  if (!client) {
    client = WS_URL
      ? new AwsRealtimeClient(WS_URL)
      : createSocketIoClient();
    if (WS_URL) client.connect();
  }
  return client;
}

export type { RealtimeLike };
