import { Router } from "express";
import * as store from "../services/snippet-store.js";

const router = Router();

router.get("/:uniqueCode", async (req, res) => {
  try {
    const snippet = await store.getSnippet(req.params.uniqueCode);

    if (!snippet) {
      res.status(404).json({ error: "Snippet not found" });
      return;
    }

    res.json(snippet);
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

    const snippet = await store.createSnippet(
      unique_code,
      code ?? "",
      language ?? "text",
    );

    res.status(201).json(snippet);
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "name" in err &&
      (err as { name: string }).name === "ConditionalCheckFailedException"
    ) {
      res.status(409).json({ error: "Snippet already exists" });
      return;
    }
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

    if (code === undefined) {
      res.status(400).json({ error: "code is required" });
      return;
    }

    const snippet = await store.saveSnippet(
      req.params.uniqueCode,
      code,
      language,
    );

    res.json(snippet);
  } catch (err) {
    console.error("PATCH snippet error:", err);
    res.status(500).json({ error: "Failed to update snippet" });
  }
});

export default router;
