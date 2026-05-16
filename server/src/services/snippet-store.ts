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
    created_at: createdAt || now,
    updated_at: updatedAt || now,
  };
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
    return toRecord(
      item.uniqueCode as string,
      item.code as string,
      item.language as string,
      item.id as string,
      item.createdAt as string,
      item.updatedAt as string,
    );
  }

  await connectDb();
  const snippet = await CodeSnippet.findOne({ uniqueCode }).lean();
  if (!snippet) return null;

  return toRecord(
    snippet.uniqueCode,
    snippet.code,
    snippet.language,
    snippet._id.toString(),
    snippet.createdAt?.toISOString(),
    snippet.updatedAt?.toISOString(),
  );
}

export async function createSnippet(
  uniqueCode: string,
  code: string,
  language: string,
): Promise<SnippetRecord> {
  const record = toRecord(uniqueCode, code, language);

  if (useDynamo()) {
    await ddb.send(
      new PutItemCommand({
        TableName: snippetsTable(),
        Item: marshall({
          uniqueCode,
          id: record.id,
          code,
          language,
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
    code,
    language,
  });
  return toRecord(
    doc.uniqueCode,
    doc.code,
    doc.language,
    doc._id.toString(),
    doc.createdAt?.toISOString(),
    doc.updatedAt?.toISOString(),
  );
}

export async function saveSnippet(
  uniqueCode: string,
  code: string,
  language?: string,
): Promise<SnippetRecord> {
  const lang = language || "text";
  const now = new Date().toISOString();

  if (useDynamo()) {
    const existing = await getSnippet(uniqueCode);
    const record = toRecord(
      uniqueCode,
      code,
      lang,
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
          code,
          language: lang,
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
    { code, language: lang },
    { new: true, upsert: true },
  );
  return toRecord(
    doc!.uniqueCode,
    doc!.code,
    doc!.language,
    doc!._id.toString(),
    doc!.createdAt?.toISOString(),
    doc!.updatedAt?.toISOString(),
  );
}
