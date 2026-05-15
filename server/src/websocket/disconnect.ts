import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import {
  deleteConnection,
  getConnection,
  syncPresence,
  wsEndpoint,
} from "../lib/ws-broadcast.js";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId!;
  const endpoint = wsEndpoint(event);

  const conn = await getConnection(connectionId);
  const roomCode = (conn?.roomCode as string) || "none";

  await deleteConnection(connectionId);

  if (roomCode && roomCode !== "none") {
    await syncPresence(endpoint, roomCode);
  }

  return { statusCode: 200, body: "Disconnected" };
};
