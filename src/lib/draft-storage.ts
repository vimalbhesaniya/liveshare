import { get, set, del } from "idb-keyval";

export type DraftRecord = {
  roomId: string;
  payload: string;
  updatedAt: number;
  serverUpdatedAt?: number;
};

const draftKey = (roomId: string) => `liveshare:draft:${roomId}`;

export async function saveDraft(
  roomId: string,
  payload: string,
  serverUpdatedAt?: number,
): Promise<void> {
  const record: DraftRecord = {
    roomId,
    payload,
    updatedAt: Date.now(),
    serverUpdatedAt,
  };
  await set(draftKey(roomId), record);
}

export async function loadDraft(roomId: string): Promise<DraftRecord | null> {
  const record = await get<DraftRecord>(draftKey(roomId));
  return record ?? null;
}

export async function clearDraft(roomId: string): Promise<void> {
  await del(draftKey(roomId));
}

/** Returns draft if it is newer than server payload by timestamp heuristic */
export function isDraftNewerThanServer(
  draft: DraftRecord,
  serverPayload: string,
  serverLoadedAt: number,
): boolean {
  if (draft.payload === serverPayload) return false;
  return draft.updatedAt > serverLoadedAt;
}
