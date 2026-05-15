import { API_BASE } from "./config";

export type SnippetRecord = {
  id: string;
  unique_code: string;
  code: string;
  language: string;
  created_at?: string;
  updated_at?: string;
};

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<{ data: T | null; error: string | null; status: number }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (res.status === 404) {
      return { data: null, error: null, status: 404 };
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        data: null,
        error: (body as { error?: string }).error || res.statusText,
        status: res.status,
      };
    }

    const data = (await res.json()) as T;
    return { data, error: null, status: res.status };
  } catch (err) {
    console.error("API request failed:", err);
    return { data: null, error: "Network error", status: 0 };
  }
}

export async function getSnippet(uniqueCode: string) {
  return request<SnippetRecord>(`/api/snippets/${uniqueCode}`);
}

export async function createSnippet(
  uniqueCode: string,
  code: string,
  language: string,
) {
  return request<SnippetRecord>("/api/snippets", {
    method: "POST",
    body: JSON.stringify({
      unique_code: uniqueCode,
      code,
      language,
    }),
  });
}

export async function updateSnippet(
  uniqueCode: string,
  code: string,
  language: string,
) {
  return request<SnippetRecord>(`/api/snippets/${uniqueCode}`, {
    method: "PATCH",
    body: JSON.stringify({ code, language }),
  });
}
