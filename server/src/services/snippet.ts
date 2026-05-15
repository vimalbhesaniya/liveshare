import { connectDb } from "../db.js";
import { CodeSnippet } from "../models/CodeSnippet.js";

export async function saveSnippet(
  uniqueCode: string,
  code: string,
  language?: string,
) {
  await connectDb();
  const update: Record<string, string> = { code };
  if (language) update.language = language;

  return CodeSnippet.findOneAndUpdate({ uniqueCode }, update, {
    new: true,
    upsert: true,
  });
}
