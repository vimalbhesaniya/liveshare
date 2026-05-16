import type { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import { saveConnection } from "../lib/ws-broadcast.js";

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId!;
  await saveConnection(connectionId);
  return { statusCode: 200, body: "Connected" };
};
