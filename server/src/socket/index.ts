import type { Server, Socket } from "socket.io";

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

export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket) => {
    let joinedCode: string | null = null;

    socket.on(
      "room:join",
      ({ uniqueCode, userId }: { uniqueCode: string; userId: string }) => {
        if (!uniqueCode || !userId) return;

        if (joinedCode && joinedCode !== uniqueCode) {
          removeFromRoom(io, socket, joinedCode);
        }

        joinedCode = uniqueCode;
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
      },
    );

    socket.on("room:leave", ({ uniqueCode }: { uniqueCode: string }) => {
      if (!uniqueCode) return;
      removeFromRoom(io, socket, uniqueCode);
      if (joinedCode === uniqueCode) joinedCode = null;
    });

    socket.on(
      "code:change",
      (payload: {
        uniqueCode: string;
        tabId: string;
        code: string;
        senderId: string;
      }) => {
        if (!payload.uniqueCode) return;
        socket
          .to(roomKey(payload.uniqueCode))
          .emit("code:change", payload);
      },
    );

    socket.on(
      "tabs:update",
      (payload: {
        uniqueCode: string;
        tabs: unknown[];
        activeTabId: string;
        senderId: string;
      }) => {
        if (!payload.uniqueCode) return;
        socket
          .to(roomKey(payload.uniqueCode))
          .emit("tabs:update", payload);
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
      }: {
        uniqueCode: string;
        code: string;
        language?: string;
        senderId?: string;
      }) => {
        if (!uniqueCode || code === undefined) return;

        try {
          const { CodeSnippet } = await import("../models/CodeSnippet.js");
          const update: Record<string, string> = { code };
          if (language) update.language = language;

          await CodeSnippet.findOneAndUpdate(
            { uniqueCode },
            update,
            { new: true },
          );

          socket.to(roomKey(uniqueCode)).emit("snippet:updated", {
            code,
            senderId,
          });
        } catch (err) {
          console.error("snippet:save error:", err);
        }
      },
    );

    socket.on("disconnect", () => {
      if (joinedCode) {
        removeFromRoom(io, socket, joinedCode);
      }
    });
  });
}
