const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

function buildUserFromHandshake(socket) {
  const token =
    socket.handshake?.auth?.token ||
    (socket.handshake?.headers?.authorization || "").replace("Bearer ", "");

  if (!token) {
    return { id: `guest_${socket.id}`, role: "guest" };
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return {
      id: payload.id,
      role: payload.role || "customer",
    };
  } catch {
    return { id: `guest_${socket.id}`, role: "guest" };
  }
}

function createMessage({ roomId, text, user }) {
  return {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    roomId,
    text: String(text || "").trim(),
    senderId: user.id,
    senderRole: user.role,
    createdAt: new Date().toISOString(),
  };
}

function setupChatSocket(httpServer, corsOptions) {
  const io = new Server(httpServer, {
    cors: corsOptions,
  });

  const rooms = new Map();

  function ensureRoom(roomId) {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        roomId,
        messages: [],
        participants: new Map(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    return rooms.get(roomId);
  }

  io.on("connection", (socket) => {
    const user = buildUserFromHandshake(socket);
    socket.data.user = user;

    socket.on("chat:join", ({ roomId }) => {
      if (!roomId) return;

      const room = ensureRoom(roomId);
      socket.join(roomId);

      room.participants.set(socket.id, {
        socketId: socket.id,
        userId: user.id,
        role: user.role,
        joinedAt: new Date().toISOString(),
      });
      room.updatedAt = new Date().toISOString();

      socket.emit("chat:history", {
        roomId,
        messages: room.messages,
      });

      io.to(roomId).emit("chat:presence", {
        roomId,
        participants: Array.from(room.participants.values()).map((p) => ({
          userId: p.userId,
          role: p.role,
        })),
      });
    });

    socket.on("chat:message", ({ roomId, text }) => {
      if (!roomId) return;
      const clean = String(text || "").trim();
      if (!clean) return;

      const room = ensureRoom(roomId);
      const msg = createMessage({ roomId, text: clean, user });

      room.messages.push(msg);
      room.updatedAt = new Date().toISOString();

      if (room.messages.length > 200) {
        room.messages = room.messages.slice(-200);
      }

      io.to(roomId).emit("chat:message", msg);
    });

    socket.on("chat:typing", ({ roomId, isTyping }) => {
      if (!roomId) return;
      socket.to(roomId).emit("chat:typing", {
        roomId,
        userId: user.id,
        role: user.role,
        isTyping: !!isTyping,
      });
    });

    socket.on("chat:listRooms", () => {
      if (user.role !== "support_agent" && user.role !== "product_manager") {
        socket.emit("chat:rooms", { rooms: [] });
        return;
      }

      const list = Array.from(rooms.values())
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
        .map((r) => ({
          roomId: r.roomId,
          participants: Array.from(r.participants.values()).map((p) => ({
            userId: p.userId,
            role: p.role,
          })),
          messageCount: r.messages.length,
          updatedAt: r.updatedAt,
        }));

      socket.emit("chat:rooms", { rooms: list });
    });

    socket.on("disconnect", () => {
      for (const room of rooms.values()) {
        if (room.participants.has(socket.id)) {
          room.participants.delete(socket.id);
          room.updatedAt = new Date().toISOString();

          io.to(room.roomId).emit("chat:presence", {
            roomId: room.roomId,
            participants: Array.from(room.participants.values()).map((p) => ({
              userId: p.userId,
              role: p.role,
            })),
          });
        }
      }
    });
  });

  return io;
}

module.exports = { setupChatSocket };
