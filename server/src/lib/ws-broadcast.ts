import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import {
  DynamoDBClient,
  QueryCommand,
  GetItemCommand,
  PutItemCommand,
  DeleteItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const ddb = new DynamoDBClient({});

function tableName() {
  return process.env.CONNECTIONS_TABLE!;
}

function mgmtClient(endpoint: string) {
  return new ApiGatewayManagementApiClient({ endpoint });
}

export function wsEndpoint(event: {
  requestContext: { domainName: string; stage: string };
}) {
  return `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
}

export async function getConnection(connectionId: string) {
  const result = await ddb.send(
    new GetItemCommand({
      TableName: tableName(),
      Key: marshall({ connectionId }),
    }),
  );
  return result.Item ? unmarshall(result.Item) : null;
}

export async function saveConnection(
  connectionId: string,
  userId?: string,
  roomCode?: string,
) {
  await ddb.send(
    new PutItemCommand({
      TableName: tableName(),
      Item: marshall({
        connectionId,
        userId: userId || "anonymous",
        roomCode: roomCode || "none",
        selection: null,
      }),
    }),
  );
}

export async function deleteConnection(connectionId: string) {
  await ddb.send(
    new DeleteItemCommand({
      TableName: tableName(),
      Key: marshall({ connectionId }),
    }),
  );
}

export async function updateConnection(
  connectionId: string,
  fields: Record<string, unknown>,
) {
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  const sets: string[] = [];

  Object.entries(fields).forEach(([key, val], i) => {
    const n = `#k${i}`;
    const v = `:v${i}`;
    names[n] = key;
    values[v] = val;
    sets.push(`${n} = ${v}`);
  });

  await ddb.send(
    new UpdateItemCommand({
      TableName: tableName(),
      Key: marshall({ connectionId }),
      UpdateExpression: `SET ${sets.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: marshall(values),
    }),
  );
}

export async function getConnectionsInRoom(roomCode: string) {
  const result = await ddb.send(
    new QueryCommand({
      TableName: tableName(),
      IndexName: "RoomCodeIndex",
      KeyConditionExpression: "roomCode = :room",
      ExpressionAttributeValues: marshall({ ":room": roomCode }),
    }),
  );

  return (result.Items || []).map((item) => unmarshall(item));
}

export async function postToConnection(
  endpoint: string,
  connectionId: string,
  data: unknown,
) {
  const client = mgmtClient(endpoint);
  try {
    await client.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: Buffer.from(JSON.stringify(data)),
      }),
    );
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "name" in err &&
      (err as { name: string }).name === "GoneException"
    ) {
      await deleteConnection(connectionId);
    } else {
      throw err;
    }
  }
}

export async function broadcastToRoom(
  endpoint: string,
  roomCode: string,
  data: unknown,
  excludeConnectionId?: string,
) {
  const connections = await getConnectionsInRoom(roomCode);
  await Promise.all(
    connections
      .filter((c) => c.connectionId !== excludeConnectionId)
      .map((c) => postToConnection(endpoint, c.connectionId as string, data)),
  );
}

export async function syncPresence(endpoint: string, roomCode: string) {
  const connections = await getConnectionsInRoom(roomCode);
  const uniqueUsers = new Set<string>();
  const selections: unknown[] = [];

  connections.forEach((c) => {
    uniqueUsers.add(c.userId as string);
    if (c.selection) {
      selections.push(c.selection);
    }
  });

  await broadcastToRoom(endpoint, roomCode, {
    event: "presence:sync",
    count: uniqueUsers.size,
    selections,
  });
}
