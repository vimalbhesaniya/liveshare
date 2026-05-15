import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { saveConnection } from "../lib/ws-broadcast.js";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId!;
  await saveConnection(connectionId);
  return { statusCode: 200, body: "Connected" };
};
