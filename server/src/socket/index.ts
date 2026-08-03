import type { Server, Socket } from "socket.io";
import { getSnippet } from "../services/snippet-store.js";
import {
  resolvePasswordHash,
  verifyPassword,
} from "../lib/password.js";

type UserSelection = {
  userId: string;
  start: number;
  end: number;
  color: string;
};

type PresenceEntry = {
  socketId: string;
  userId: string;
  selection: UserSelection | null;
};

const roomPresence = new Map<string, Map<string, PresenceEntry>>();

function roomKey(uniqueCode: string) {
  return `room:${uniqueCode}`;
}

function broadcastPresence(io: Server, uniqueCode: string) {
  const room = roomKey(uniqueCode);
  const presence = roomPresence.get(room);
  const selections: UserSelection[] = [];
  const uniqueUsers = new Set<string>();

  presence?.forEach((entry) => {
    uniqueUsers.add(entry.userId);
    if (entry.selection) {
      selections.push(entry.selection);
    }
  });

  io.to(room).emit("presence:sync", {
    count: uniqueUsers.size,
    selections,
  });
}

function removeFromRoom(io: Server, socket: Socket, uniqueCode: string) {
  const room = roomKey(uniqueCode);
  const presence = roomPresence.get(room);
  presence?.delete(socket.id);

  if (presence?.size === 0) {
    roomPresence.delete(room);
  }

  socket.leave(room);
  broadcastPresence(io, uniqueCode);
}

async function assertRoomAccess(
  uniqueCode: string,
  password?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const snippet = await getSnippet(uniqueCode);
    if (!snippet) return { ok: true }; // room may be created after join
    const hash = resolvePasswordHash(snippet.password_hash, snippet.code);
    if (!hash) return { ok: true };
    if (!password || !verifyPassword(password, hash)) {
      return { ok: false, error: "Password required" };
    }
    return { ok: true };
  } catch (err) {
    console.error("room access check failed:", err);
    return { ok: false, error: "Access check failed" };
  }
}

export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket) => {
    let joinedCode: string | null = null;
    let roomPassword: string | undefined;

    socket.on(
      "room:join",
      async ({
        uniqueCode,
        userId,
        password,
      }: {
        uniqueCode: string;
        userId: string;
        password?: string;
      }) => {
        if (!uniqueCode || !userId) return;

        const access = await assertRoomAccess(uniqueCode, password);
        if (!access.ok) {
          socket.emit("room:error", {
            uniqueCode,
            error: access.error,
            password_required: true,
          });
          return;
        }

        if (joinedCode && joinedCode !== uniqueCode) {
          removeFromRoom(io, socket, joinedCode);
        }

        joinedCode = uniqueCode;
        roomPassword = password;
        const room = roomKey(uniqueCode);
        socket.join(room);

        if (!roomPresence.has(room)) {
          roomPresence.set(room, new Map());
        }

        roomPresence.get(room)!.set(socket.id, {
          socketId: socket.id,
          userId,
          selection: null,
        });

        broadcastPresence(io, uniqueCode);
        socket.emit("room:joined", { uniqueCode });
      },
    );

    socket.on("room:leave", ({ uniqueCode }: { uniqueCode: string }) => {
      if (!uniqueCode) return;
      removeFromRoom(io, socket, uniqueCode);
      if (joinedCode === uniqueCode) {
        joinedCode = null;
        roomPassword = undefined;
      }
    });

    socket.on(
      "doc:ops",
      async (payload: {
        uniqueCode: string;
        senderId: string;
        baseLength: number;
        ops: unknown[];
        code?: string;
      }) => {
        if (!payload.uniqueCode || !payload.ops) return;
        if (joinedCode !== payload.uniqueCode) return;
        socket.to(roomKey(payload.uniqueCode)).emit("doc:ops", payload);
      },
    );

    socket.on(
      "code:change",
      (payload: {
        uniqueCode: string;
        code: string;
        senderId: string;
      }) => {
        if (!payload.uniqueCode || payload.code === undefined) return;
        if (joinedCode !== payload.uniqueCode) return;
        socket
          .to(roomKey(payload.uniqueCode))
          .emit("code:change", payload);
      },
    );

    socket.on(
      "selection:change",
      async ({
        uniqueCode,
        userId,
        selection,
      }: {
        uniqueCode: string;
        userId: string;
        selection: UserSelection | null;
      }) => {
        if (!uniqueCode || !userId) return;
        if (joinedCode !== uniqueCode) return;

        const room = roomKey(uniqueCode);
        const presence = roomPresence.get(room);
        const entry = presence?.get(socket.id);

        if (entry) {
          entry.selection = selection;
          broadcastPresence(io, uniqueCode);
        }
      },
    );

    socket.on(
      "snippet:save",
      async ({
        uniqueCode,
        code,
        language,
        senderId,
        password,
      }: {
        uniqueCode: string;
        code: string;
        language?: string;
        senderId?: string;
        password?: string;
      }) => {
        if (!uniqueCode || code === undefined) return;
        if (joinedCode !== uniqueCode) return;

        const access = await assertRoomAccess(
          uniqueCode,
          password ?? roomPassword,
        );
        if (!access.ok) {
          socket.emit("room:error", {
            uniqueCode,
            error: access.error,
            password_required: true,
          });
          return;
        }

        try {
          const { saveSnippet } = await import("../services/snippet.js");
          await saveSnippet(uniqueCode, code, language);
          socket.to(roomKey(uniqueCode)).emit("snippet:updated", {
            code,
            senderId,
          });
        } catch (err) {
          console.error("snippet:save error:", err);
        }
      },
    );

    socket.on(
      "snippet:sync",
      ({
        uniqueCode,
        code,
        senderId,
      }: {
        uniqueCode: string;
        code: string;
        senderId?: string;
      }) => {
        if (!uniqueCode || code === undefined) return;
        if (joinedCode !== uniqueCode) return;
        socket.to(roomKey(uniqueCode)).emit("snippet:updated", { code, senderId });
      },
    );

    socket.on("disconnect", () => {
      if (joinedCode) {
        removeFromRoom(io, socket, joinedCode);
      }
    });
  });
}
