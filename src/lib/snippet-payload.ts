export type SnippetPayload = {
  code: string;
  language: string;
  passwordHash: string | null;
};

/** Parse DB / legacy multi-tab JSON into a single document. */
export function parseSnippetStorage(
  raw: string,
  fallbackLanguage: string,
): SnippetPayload {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed.tabs && Array.isArray(parsed.tabs) && parsed.tabs.length > 0) {
      const tabs = parsed.tabs as Array<{
        id?: string;
        code?: string;
        language?: string;
      }>;
      const activeId = parsed.activeTabId as string | undefined;
      const tab =
        tabs.find((t) => t.id === activeId) ?? tabs[0];
      return {
        code: tab.code ?? "",
        language: tab.language ?? fallbackLanguage,
        passwordHash: (parsed.passwordHash as string | null) ?? null,
      };
    }
    if (typeof parsed.code === "string") {
      return {
        code: parsed.code,
        language: (parsed.language as string) ?? fallbackLanguage,
        passwordHash: (parsed.passwordHash as string | null) ?? null,
      };
    }
  } catch {
    // plain text legacy
  }
  return {
    code: raw,
    language: fallbackLanguage,
    passwordHash: null,
  };
}

export function stringifySnippetPayload(payload: SnippetPayload): string {
  return JSON.stringify(payload);
}
