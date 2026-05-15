import dotenv from "dotenv";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { connectDb } from "./db.js";
import { createApp } from "./app.js";
import { registerSocketHandlers } from "./socket/index.js";
import { Server } from "socket.io";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(rootDir, ".env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
}

const PORT = Number(process.env.PORT) || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:8080";

async function main() {
  requireEnv("MONGODB_URI");
  await connectDb();
  console.log("Connected to MongoDB");

  const app = createApp();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: CLIENT_ORIGIN.split(",").map((o) => o.trim()),
      credentials: true,
    },
    maxHttpBufferSize: 10e6,
  });

  registerSocketHandlers(io);

  httpServer.listen(PORT, () => {
    console.log(`Local server running on http://localhost:${PORT}`);
    console.log("(Use serverless deploy for AWS)");
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
