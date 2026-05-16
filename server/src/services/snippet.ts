import { saveSnippet as persistSnippet } from "./snippet-store.js";

export async function saveSnippet(
  uniqueCode: string,
  code: string,
  language?: string,
) {
  return persistSnippet(uniqueCode, code, language);
}
