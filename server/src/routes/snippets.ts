import { Router } from "express";
import * as store from "../services/snippet-store.js";
import {
  hashPassword,
  resolvePasswordHash,
  stripPasswordFromCode,
  verifyPassword,
} from "../lib/password.js";

const router = Router();

/** Unlock/auth password — never use body.password (that's for *setting* a new one). */
function authPasswordFromRequest(req: {
  header(name: string): string | undefined;
  body?: { current_password?: unknown };
}): string | undefined {
  const header = req.header("x-snippet-password");
  if (header) return header;
  const current = req.body?.current_password;
  if (typeof current === "string" && current) return current;
  return undefined;
}

function publicSnippet(
  snippet: store.SnippetRecord,
  opts?: { includeCode?: boolean },
) {
  const protected_ = Boolean(snippet.password_hash);
  return {
    id: snippet.id,
    unique_code: snippet.unique_code,
    language: snippet.language,
    created_at: snippet.created_at,
    updated_at: snippet.updated_at,
    password_protected: protected_,
    code:
      opts?.includeCode === false
        ? ""
        : stripPasswordFromCode(snippet.code),
  };
}

async function maybeUpgradeLegacyHash(
  snippet: store.SnippetRecord,
  plainPassword: string,
) {
  // Upgrade legacy embedded hashes to scrypt + dedicated field
  if (snippet.password_hash?.startsWith("scrypt$")) return;
  const upgraded = hashPassword(plainPassword);
  await store.saveSnippet(
    snippet.unique_code,
    stripPasswordFromCode(snippet.code),
    snippet.language,
    upgraded,
  );
  snippet.password_hash = upgraded;
  snippet.code = stripPasswordFromCode(snippet.code);
}

router.get("/:uniqueCode", async (req, res) => {
  try {
    const snippet = await store.getSnippet(req.params.uniqueCode);

    if (!snippet) {
      res.status(404).json({ error: "Snippet not found" });
      return;
    }

    const pwdHash = resolvePasswordHash(snippet.password_hash, snippet.code);
    snippet.password_hash = pwdHash;

    if (pwdHash) {
      const provided = authPasswordFromRequest(req);
      if (!provided || !verifyPassword(provided, pwdHash)) {
        res.status(401).json({
          password_required: true,
          id: snippet.id,
          unique_code: snippet.unique_code,
          language: snippet.language,
          error: "Password required",
        });
        return;
      }
      await maybeUpgradeLegacyHash(snippet, provided);
    }

    res.json(publicSnippet(snippet));
  } catch (err) {
    console.error("GET snippet error:", err);
    res.status(500).json({ error: "Failed to load snippet" });
  }
});

router.post("/:uniqueCode/unlock", async (req, res) => {
  try {
    const snippet = await store.getSnippet(req.params.uniqueCode);
    if (!snippet) {
      res.status(404).json({ error: "Snippet not found" });
      return;
    }

    const pwdHash = resolvePasswordHash(snippet.password_hash, snippet.code);
    snippet.password_hash = pwdHash;

    if (!pwdHash) {
      res.json(publicSnippet(snippet));
      return;
    }

    const password =
      typeof req.body?.password === "string" ? req.body.password : "";
    if (!password || !verifyPassword(password, pwdHash)) {
      res.status(401).json({
        password_required: true,
        error: "Incorrect password",
      });
      return;
    }

    await maybeUpgradeLegacyHash(snippet, password);
    res.json(publicSnippet(snippet));
  } catch (err) {
    console.error("UNLOCK snippet error:", err);
    res.status(500).json({ error: "Failed to unlock snippet" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { unique_code, code, language, password } = req.body;

    if (!unique_code || typeof unique_code !== "string") {
      res.status(400).json({ error: "unique_code is required" });
      return;
    }

    const passwordHash =
      typeof password === "string" && password
        ? hashPassword(password)
        : null;

    const snippet = await store.createSnippet(
      unique_code,
      code ?? "",
      language ?? "text",
      passwordHash,
    );

    res.status(201).json(publicSnippet(snippet));
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
    const { code, language, password } = req.body;

    if (code === undefined) {
      res.status(400).json({ error: "code is required" });
      return;
    }

    const existing = await store.getSnippet(req.params.uniqueCode);
    if (!existing) {
      // Upsert-style create for first save races
      const passwordHash =
        typeof password === "string" && password
          ? hashPassword(password)
          : password === null
            ? null
            : null;
      const snippet = await store.createSnippet(
        req.params.uniqueCode,
        code,
        language ?? "text",
        passwordHash,
      );
      res.json(publicSnippet(snippet));
      return;
    }

    const pwdHash = resolvePasswordHash(existing.password_hash, existing.code);
    if (pwdHash) {
      const provided = authPasswordFromRequest(req);
      if (!provided || !verifyPassword(provided, pwdHash)) {
        res.status(401).json({
          password_required: true,
          error: "Password required to update snippet",
        });
        return;
      }
    }

    let nextPasswordHash: string | null | undefined = undefined;
    if (password === null) {
      nextPasswordHash = null;
    } else if (typeof password === "string") {
      nextPasswordHash = password ? hashPassword(password) : null;
    }

    const snippet = await store.saveSnippet(
      req.params.uniqueCode,
      code,
      language,
      nextPasswordHash,
    );

    res.json(publicSnippet(snippet));
  } catch (err) {
    console.error("PATCH snippet error:", err);
    res.status(500).json({ error: "Failed to update snippet" });
  }
});

export default router;
