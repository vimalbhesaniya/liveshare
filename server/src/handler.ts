import type { Handler } from "aws-lambda";
import type { Application } from "express";
import { createApp } from "./app.js";

// CJS package — use require for Lambda bundle compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
const configure = require("@codegenie/serverless-express") as (options: {
  app: Application;
}) => Handler;

const app = createApp();
const expressHandler = configure({ app });

export const api: Handler = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  return expressHandler(event, context, callback);
};
