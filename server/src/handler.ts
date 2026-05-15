import serverless from "serverless-http";
import type { Handler } from "aws-lambda";
import { connectDb } from "./db.js";
import { createApp } from "./app.js";

let cachedHandler: ReturnType<typeof serverless> | undefined;

export const api: Handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await connectDb();

  if (!cachedHandler) {
    cachedHandler = serverless(createApp());
  }

  return cachedHandler(event, context);
};
