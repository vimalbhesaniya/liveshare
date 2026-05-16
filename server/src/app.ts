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

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/snippets", snippetsRouter);

  return app;
}
