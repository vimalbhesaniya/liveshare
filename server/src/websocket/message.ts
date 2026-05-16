import type { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import { saveSnippet } from "../services/snippet.js";
import {
  broadcastToRoom,
  syncPresence,
  updateConnection,
  wsEndpoint,
} from "../lib/ws-broadcast.js";

type WsBody = {
  action: string;
  uniqueCode?: string;
  userId?: string;
  tabId?: string;
  code?: string;
  senderId?: string;
  tabs?: unknown[];
  activeTabId?: string;
  selection?: unknown;
  language?: string;
};

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId!;
  const endpoint = wsEndpoint(event);

  if (!event.body) {
    return { statusCode: 400, body: "Empty body" };
  }

  let body: WsBody;
  try {
    body = JSON.parse(event.body) as WsBody;
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { action } = body;

  switch (action) {
    case "room:join": {
      if (!body.uniqueCode || !body.userId) break;
      await updateConnection(connectionId, {
        roomCode: body.uniqueCode,
        userId: body.userId,
        selection: null,
      });
      await syncPresence(endpoint, body.uniqueCode);
      break;
    }

    case "room:leave": {
      if (!body.uniqueCode) break;
      await updateConnection(connectionId, {
        roomCode: "none",
        selection: null,
      });
      await syncPresence(endpoint, body.uniqueCode);
      break;
    }

    case "code:change": {
      if (!body.uniqueCode) break;
      await broadcastToRoom(
        endpoint,
        body.uniqueCode,
        { event: "code:change", ...body },
        connectionId,
      );
      break;
    }

    case "tabs:update": {
      if (!body.uniqueCode) break;
      await broadcastToRoom(
        endpoint,
        body.uniqueCode,
        { event: "tabs:update", ...body },
        connectionId,
      );
      break;
    }

    case "selection:change": {
      if (!body.uniqueCode || !body.userId) break;
      await updateConnection(connectionId, {
        selection: body.selection ?? null,
      });
      await syncPresence(endpoint, body.uniqueCode);
      break;
    }

    case "snippet:save": {
      if (!body.uniqueCode || body.code === undefined) break;
      try {
        await saveSnippet(body.uniqueCode, body.code, body.language);
        await broadcastToRoom(
          endpoint,
          body.uniqueCode,
          {
            event: "snippet:updated",
            code: body.code,
            senderId: body.senderId,
          },
          connectionId,
        );
      } catch (err) {
        console.error("snippet:save error:", err);
      }
      break;
    }

    case "snippet:sync": {
      if (!body.uniqueCode || body.code === undefined) break;
      await broadcastToRoom(
        endpoint,
        body.uniqueCode,
        {
          event: "snippet:updated",
          code: body.code,
          senderId: body.senderId,
        },
        connectionId,
      );
      break;
    }

    default:
      return { statusCode: 400, body: `Unknown action: ${action}` };
  }

  return { statusCode: 200, body: "OK" };
};
