import { Router } from "express";
import { connectDb } from "../db.js";
import { CodeSnippet } from "../models/CodeSnippet.js";
import { saveSnippet } from "../services/snippet.js";

const router = Router();

router.use(async (_req, _res, next) => {
  try {
    await connectDb();
    next();
  } catch (err) {
    next(err);
  }
});

router.get("/:uniqueCode", async (req, res) => {
  try {
    const snippet = await CodeSnippet.findOne({
      uniqueCode: req.params.uniqueCode,
    }).lean();

    if (!snippet) {
      res.status(404).json({ error: "Snippet not found" });
      return;
    }

    res.json({
      id: snippet._id.toString(),
      unique_code: snippet.uniqueCode,
      code: snippet.code,
      language: snippet.language,
      created_at: snippet.createdAt,
      updated_at: snippet.updatedAt,
    });
  } catch (err) {
    console.error("GET snippet error:", err);
    res.status(500).json({ error: "Failed to load snippet" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { unique_code, code, language } = req.body;

    if (!unique_code || typeof unique_code !== "string") {
      res.status(400).json({ error: "unique_code is required" });
      return;
    }

    const snippet = await CodeSnippet.create({
      uniqueCode: unique_code,
      code: code ?? "",
      language: language ?? "text",
    });

    res.status(201).json({
      id: snippet._id.toString(),
      unique_code: snippet.uniqueCode,
      code: snippet.code,
      language: snippet.language,
      created_at: snippet.createdAt,
      updated_at: snippet.updatedAt,
    });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      res.status(409).json({ error: "Snippet already exists" });
      return;
    }
    console.error("POST snippet error:", err);
    res.status(500).json({ error: "Failed to create snippet" });
  }
});

router.patch("/:uniqueCode", async (req, res) => {
  try {
    const { code, language } = req.body;
    const update: Record<string, string> = {};

    if (code === undefined) {
      res.status(400).json({ error: "code is required" });
      return;
    }

    if (language !== undefined) update.language = language;

    const doc = await saveSnippet(
      req.params.uniqueCode,
      code,
      update.language,
    );
    const snippet = doc.toObject();

    res.json({
      id: snippet._id.toString(),
      unique_code: snippet.uniqueCode,
      code: snippet.code,
      language: snippet.language,
      created_at: snippet.createdAt,
      updated_at: snippet.updatedAt,
    });
  } catch (err) {
    console.error("PATCH snippet error:", err);
    res.status(500).json({ error: "Failed to update snippet" });
  }
});

export default router;
