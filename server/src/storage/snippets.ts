import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { connectDb } from "../db.js";
import { CodeSnippet } from "../models/CodeSnippet.js";

export type SnippetRecord = {
  id: string;
  unique_code: string;
  code: string;
  language: string;
  created_at: string;
  updated_at: string;
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
  createdAt: string,
  updatedAt: string,
  id?: string,
): SnippetRecord {
  return {
    id: id || uniqueCode,
    unique_code: uniqueCode,
    code,
    language,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

async function getSnippetDynamo(uniqueCode: string): Promise<SnippetRecord | null> {
  const result = await ddb.send(
    new GetItemCommand({
      TableName: snippetsTable(),
      Key: marshall({ uniqueCode }),
    }),
  );
  if (!result.Item) return null;
  const item = unmarshall(result.Item);
  return toRecord(
    item.uniqueCode as string,
    item.code as string,
    item.language as string,
    item.createdAt as string,
    item.updatedAt as string,
    item.id as string | undefined,
  );
}

async function createSnippetDynamo(
  uniqueCode: string,
  code: string,
  language: string,
): Promise<SnippetRecord> {
  const now = new Date().toISOString();
  const item = {
    uniqueCode,
    id: uniqueCode,
    code,
    language,
    createdAt: now,
    updatedAt: now,
  };
  await ddb.send(
    new PutItemCommand({
      TableName: snippetsTable(),
      Item: marshall(item),
      ConditionExpression: "attribute_not_exists(uniqueCode)",
    }),
  );
  return toRecord(uniqueCode, code, language, now, now);
}

async function saveSnippetDynamo(
  uniqueCode: string,
  code: string,
  language?: string,
): Promise<SnippetRecord> {
  const existing = await getSnippetDynamo(uniqueCode);
  const now = new Date().toISOString();
  const createdAt = existing?.created_at || now;
  const lang = language ?? existing?.language ?? "text";
  const item = {
    uniqueCode,
    id: existing?.id || uniqueCode,
    code,
    language: lang,
    createdAt,
    updatedAt: now,
  };
  await ddb.send(
    new PutItemCommand({
      TableName: snippetsTable(),
      Item: marshall(item),
    }),
  );
  return toRecord(uniqueCode, code, lang, createdAt, now, item.id);
}

async function getSnippetMongo(uniqueCode: string): Promise<SnippetRecord | null> {
  await connectDb();
  const snippet = await CodeSnippet.findOne({ uniqueCode }).lean();
  if (!snippet) return null;
  return {
    id: snippet._id.toString(),
    unique_code: snippet.uniqueCode,
    code: snippet.code,
    language: snippet.language,
    created_at: snippet.createdAt.toISOString(),
    updated_at: snippet.updatedAt.toISOString(),
  };
}

async function createSnippetMongo(
  uniqueCode: string,
  code: string,
  language: string,
): Promise<SnippetRecord> {
  await connectDb();
  const snippet = await CodeSnippet.create({ uniqueCode, code, language });
  return {
    id: snippet._id.toString(),
    unique_code: snippet.uniqueCode,
    code: snippet.code,
    language: snippet.language,
    created_at: snippet.createdAt.toISOString(),
    updated_at: snippet.updatedAt.toISOString(),
  };
}

async function saveSnippetMongo(
  uniqueCode: string,
  code: string,
  language?: string,
): Promise<SnippetRecord> {
  await connectDb();
  const update: Record<string, string> = { code };
  if (language) update.language = language;
  const doc = await CodeSnippet.findOneAndUpdate({ uniqueCode }, update, {
    new: true,
    upsert: true,
  });
  return {
    id: doc._id.toString(),
    unique_code: doc.uniqueCode,
    code: doc.code,
    language: doc.language,
    created_at: doc.createdAt.toISOString(),
    updated_at: doc.updatedAt.toISOString(),
  };
}

export async function getSnippet(
  uniqueCode: string,
): Promise<SnippetRecord | null> {
  return useDynamo()
    ? getSnippetDynamo(uniqueCode)
    : getSnippetMongo(uniqueCode);
}

export async function createSnippet(
  uniqueCode: string,
  code: string,
  language: string,
): Promise<SnippetRecord> {
  return useDynamo()
    ? createSnippetDynamo(uniqueCode, code, language)
    : createSnippetMongo(uniqueCode, code, language);
}

export async function saveSnippet(
  uniqueCode: string,
  code: string,
  language?: string,
): Promise<SnippetRecord> {
  return useDynamo()
    ? saveSnippetDynamo(uniqueCode, code, language)
    : saveSnippetMongo(uniqueCode, code, language);
}
