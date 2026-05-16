import express from "express";
import cors from "cors";
import snippetsRouter from "./routes/snippets.js";

export function createApp() {
  const app = express();
  const raw = process.env.CLIENT_ORIGIN || "http://localhost:8080";
  const allowedOrigins = raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "10mb" }));

  app.get("/health", async (_req, res) => {
    const storage = process.env.SNIPPETS_TABLE ? "dynamodb" : "mongodb";
    try {
      if (process.env.SNIPPETS_TABLE) {
        res.json({ status: "ok", storage });
        return;
      }
      const { connectDb } = await import("./db.js");
      await connectDb();
      res.json({ status: "ok", storage, database: "connected" });
    } catch (err) {
      console.error("Health check failed:", err);
      res.status(503).json({
        status: "error",
        storage,
        message:
          err instanceof Error ? err.message : "Database connection failed",
      });
    }
  });

  app.use("/api/snippets", snippetsRouter);

  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error("Unhandled error:", err);
      res.status(500).json({ error: "Internal server error" });
    },
  );

  return app;
}
