import { API_BASE } from "./config";

export type SnippetRecord = {
  id: string;
  unique_code: string;
  code: string;
  language: string;
  password_protected?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type LockedSnippet = {
  password_required: true;
  id?: string;
  unique_code: string;
  language?: string;
  error?: string;
};

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<{ data: T | null; error: string | null; status: number; raw?: unknown }> {
  try {
    const headers = new Headers(options?.headers);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 404) {
      return { data: null, error: null, status: 404 };
    }

    const body = await res.json().catch(() => ({}));

    if (res.status === 401) {
      return {
        data: null,
        error: (body as { error?: string }).error || "Need password to open this code",
        status: 401,
        raw: body,
      };
    }

    if (!res.ok) {
      return {
        data: null,
        error: (body as { error?: string }).error || res.statusText,
        status: res.status,
        raw: body,
      };
    }

    return { data: body as T, error: null, status: res.status };
  } catch (err) {
    console.error("API request failed:", err);
    return { data: null, error: "Network error", status: 0 };
  }
}

function authHeaders(password?: string | null): HeadersInit {
  if (!password) return {};
  return { "x-snippet-password": password };
}

export async function getSnippet(uniqueCode: string, password?: string | null) {
  return request<SnippetRecord>(`/api/snippets/${uniqueCode}`, {
    headers: authHeaders(password),
  });
}

export async function unlockSnippet(uniqueCode: string, password: string) {
  return request<SnippetRecord>(
    `/api/snippets/${encodeURIComponent(uniqueCode)}/unlock`,
    {
      method: "POST",
      body: JSON.stringify({ password }),
    },
  );
}

export async function createSnippet(
  uniqueCode: string,
  code: string,
  language: string,
  password?: string | null,
) {
  return request<SnippetRecord>("/api/snippets", {
    method: "POST",
    body: JSON.stringify({
      unique_code: uniqueCode,
      code,
      language,
      ...(password ? { password } : {}),
    }),
  });
}

export type UpdateSnippetOptions = {
  /** Plain password used to authorize updates on protected snippets */
  currentPassword?: string | null;
  /** Set a new password, or null to remove protection */
  password?: string | null;
};

export async function updateSnippet(
  uniqueCode: string,
  code: string,
  language: string,
  options?: UpdateSnippetOptions,
) {
  const body: Record<string, unknown> = { code, language };
  if (options && "password" in options) {
    body.password = options.password;
  }
  if (options?.currentPassword) {
    body.current_password = options.currentPassword;
  }

  return request<SnippetRecord>(`/api/snippets/${uniqueCode}`, {
    method: "PATCH",
    headers: authHeaders(options?.currentPassword),
    body: JSON.stringify(body),
  });
}

/** Save on page close — uses keepalive so the request finishes after unload. */
export function saveSnippetKeepalive(
  uniqueCode: string,
  code: string,
  language: string,
  currentPassword?: string | null,
) {
  const url = `${API_BASE}/api/snippets/${encodeURIComponent(uniqueCode)}`;
  const body: Record<string, unknown> = { code, language };
  if (currentPassword) body.current_password = currentPassword;

  return fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(currentPassword),
    },
    body: JSON.stringify(body),
    keepalive: true,
  });
}

export function isPasswordRequiredResponse(raw: unknown): raw is LockedSnippet {
  return Boolean(
    raw &&
      typeof raw === "object" &&
      (raw as LockedSnippet).password_required === true,
  );
}
