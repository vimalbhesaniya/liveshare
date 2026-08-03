import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { connectDb } from "../db.js";
import { CodeSnippet } from "../models/CodeSnippet.js";
import {
  extractLegacyPasswordHash,
  stripPasswordFromCode,
} from "../lib/password.js";

export type SnippetRecord = {
  id: string;
  unique_code: string;
  code: string;
  language: string;
  password_hash: string | null;
  created_at?: string;
  updated_at?: string;
};

const ddb = new DynamoDBClient({});

function snippetsTable() {
  return process.env.SNIPPETS_TABLE;
}

function useDynamo() {
  return Boolean(snippetsTable());
}

function toRecord(
  uniqueCode: string,
  code: string,
  language: string,
  passwordHash: string | null,
  id?: string,
  createdAt?: string,
  updatedAt?: string,
): SnippetRecord {
  const now = new Date().toISOString();
  return {
    id: id || uniqueCode,
    unique_code: uniqueCode,
    code,
    language,
    password_hash: passwordHash,
    created_at: createdAt || now,
    updated_at: updatedAt || now,
  };
}

function coalescePasswordHash(
  stored: string | null | undefined,
  code: string,
): string | null {
  if (stored) return stored;
  return extractLegacyPasswordHash(code);
}

export async function getSnippet(
  uniqueCode: string,
): Promise<SnippetRecord | null> {
  if (useDynamo()) {
    const result = await ddb.send(
      new GetItemCommand({
        TableName: snippetsTable(),
        Key: marshall({ uniqueCode }),
      }),
    );
    if (!result.Item) return null;
    const item = unmarshall(result.Item);
    const code = (item.code as string) || "";
    return toRecord(
      item.uniqueCode as string,
      code,
      (item.language as string) || "text",
      coalescePasswordHash(item.passwordHash as string | undefined, code),
      item.id as string,
      item.createdAt as string,
      item.updatedAt as string,
    );
  }

  await connectDb();
  const snippet = await CodeSnippet.findOne({ uniqueCode }).lean();
  if (!snippet) return null;

  const code = snippet.code || "";
  return toRecord(
    snippet.uniqueCode,
    code,
    snippet.language,
    coalescePasswordHash(snippet.passwordHash, code),
    snippet._id.toString(),
    snippet.createdAt?.toISOString(),
    snippet.updatedAt?.toISOString(),
  );
}

export async function createSnippet(
  uniqueCode: string,
  code: string,
  language: string,
  passwordHash: string | null = null,
): Promise<SnippetRecord> {
  const cleanCode = stripPasswordFromCode(code);
  const record = toRecord(uniqueCode, cleanCode, language, passwordHash);

  if (useDynamo()) {
    await ddb.send(
      new PutItemCommand({
        TableName: snippetsTable(),
        Item: marshall({
          uniqueCode,
          id: record.id,
          code: cleanCode,
          language,
          passwordHash: passwordHash || null,
          createdAt: record.created_at,
          updatedAt: record.updated_at,
        }),
        ConditionExpression: "attribute_not_exists(uniqueCode)",
      }),
    );
    return record;
  }

  await connectDb();
  const doc = await CodeSnippet.create({
    uniqueCode,
    code: cleanCode,
    language,
    passwordHash: passwordHash || null,
  });
  return toRecord(
    doc.uniqueCode,
    doc.code,
    doc.language,
    doc.passwordHash || null,
    doc._id.toString(),
    doc.createdAt?.toISOString(),
    doc.updatedAt?.toISOString(),
  );
}

/**
 * @param passwordHash `undefined` = keep existing, `null` = clear, string = set
 */
export async function saveSnippet(
  uniqueCode: string,
  code: string,
  language?: string,
  passwordHash?: string | null,
): Promise<SnippetRecord> {
  const existing = await getSnippet(uniqueCode);
  const lang = language || existing?.language || "text";
  const now = new Date().toISOString();
  const cleanCode = stripPasswordFromCode(code);
  const nextHash =
    passwordHash === undefined
      ? existing?.password_hash ?? null
      : passwordHash;

  if (useDynamo()) {
    const record = toRecord(
      uniqueCode,
      cleanCode,
      lang,
      nextHash,
      existing?.id,
      existing?.created_at,
      now,
    );

    await ddb.send(
      new PutItemCommand({
        TableName: snippetsTable(),
        Item: marshall({
          uniqueCode,
          id: record.id,
          code: cleanCode,
          language: lang,
          passwordHash: nextHash,
          createdAt: record.created_at,
          updatedAt: now,
        }),
      }),
    );
    return record;
  }

  await connectDb();
  const doc = await CodeSnippet.findOneAndUpdate(
    { uniqueCode },
    { code: cleanCode, language: lang, passwordHash: nextHash },
    { new: true, upsert: true },
  );
  return toRecord(
    doc!.uniqueCode,
    doc!.code,
    doc!.language,
    doc!.passwordHash || null,
    doc!._id.toString(),
    doc!.createdAt?.toISOString(),
    doc!.updatedAt?.toISOString(),
  );
}
