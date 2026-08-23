/** Matches server `makeViewToken` (default secret). Opaque enough that
 * `/r/{token}` ≠ `/{editCode}`, so stripping `/r` does not open edit mode. */
const VIEW_SECRET =
  import.meta.env.VITE_VIEW_LINK_SECRET || "liveshare-dev-view-secret";

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]!);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function utf8ToBase64Url(text: string): string {
  return toBase64Url(new TextEncoder().encode(text));
}

async function hmacSha256Base64Url(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return toBase64Url(sig).slice(0, 22);
}

/** Same format as server `makeViewToken`. */
export async function makeViewToken(uniqueCode: string): Promise<string> {
  const payload = utf8ToBase64Url(uniqueCode);
  const sig = await hmacSha256Base64Url(`view:${uniqueCode}`, VIEW_SECRET);
  return `${payload}.${sig}`;
}

export function isViewTokenFormat(code: string): boolean {
  const parts = code.split(".");
  return parts.length === 2 && Boolean(parts[0] && parts[1]);
}
