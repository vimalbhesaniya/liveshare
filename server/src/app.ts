import express from "express";
import cors from "cors";
import snippetsRouter from "./routes/snippets.js";

export function createApp() {
  const app = express();
  const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:8080";

  app.use(
    cors({
      origin: clientOrigin.split(",").map((o) => o.trim()),
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
