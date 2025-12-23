const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const User = require("../models/User");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Wishlist = require("../models/Wishlist");

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
    attachments: [],
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
        createdBy: null,
        claimedBy: null,
        customerId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    return rooms.get(roomId);
  }

  function buildRoomSummary(room) {
    const participants = Array.from(room.participants.values()).map((p) => ({
      userId: p.userId,
      role: p.role,
    }));
    const hasCustomer = participants.some((p) => p.role === "customer" || p.role === "guest");
    const lastMessage = room.messages[room.messages.length - 1];
    return {
      roomId: room.roomId,
      participants,
      messageCount: room.messages.length,
      updatedAt: room.updatedAt,
      claimedBy: room.claimedBy,
      hasCustomer,
      lastMessage: lastMessage
        ? { text: lastMessage.text, createdAt: lastMessage.createdAt }
        : null,
    };
  }

  async function buildCustomerContext(userId) {
    const user = await User.findById(userId, {
      email: 1,
      username: 1,
      fullName: 1,
      homeAddress: 1,
    }).lean();

    const cart = await Cart.findOne({ userId }).lean();
    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).limit(5).lean();
    const wishlist = await Wishlist.findOne({ userId }).lean();

    return {
      profile: user || null,
      cart: cart || { items: [] },
      orders: orders || [],
      wishlist: wishlist || { items: [] },
    };
  }

  io.on("connection", (socket) => {
    const user = buildUserFromHandshake(socket);
    socket.data.user = user;

    socket.on("chat:request", ({ roomId }) => {
      const finalRoomId =
        roomId || `room_${Date.now()}_${Math.random().toString(16).slice(2)}`;

      const room = ensureRoom(finalRoomId);
      if (!room.createdBy) {
        room.createdBy = user.id;
      }
      if (user.role === "customer") {
        room.customerId = user.id;
      }

      socket.join(finalRoomId);
      room.participants.set(socket.id, {
        socketId: socket.id,
        userId: user.id,
        role: user.role,
        joinedAt: new Date().toISOString(),
      });
      room.updatedAt = new Date().toISOString();

      socket.emit("chat:joined", { roomId: finalRoomId });
      socket.emit("chat:history", { roomId: finalRoomId, messages: room.messages });
      io.emit("chat:rooms", { rooms: Array.from(rooms.values()).map(buildRoomSummary) });
    });

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
      if (user.role === "customer") {
        room.customerId = user.id;
      }

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

    socket.on("chat:message", ({ roomId, text, attachments }) => {
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room || !room.participants.has(socket.id)) return;
      const clean = String(text || "").trim();
      const cleanAttachments = Array.isArray(attachments)
        ? attachments
            .filter((item) => item && item.url)
            .map((item) => ({
              url: String(item.url),
              name: item.name ? String(item.name) : "",
              type: item.type ? String(item.type) : "",
              size: Number(item.size || 0),
            }))
        : [];

      if (!clean && cleanAttachments.length === 0) return;

      const msg = createMessage({ roomId, text: clean, user });
      msg.attachments = cleanAttachments;

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
      if (user.role !== "support_agent") {
        socket.emit("chat:rooms", { rooms: [] });
        return;
      }

      const list = Array.from(rooms.values())
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
        .map(buildRoomSummary);

      socket.emit("chat:rooms", { rooms: list });
    });

    socket.on("chat:claim", ({ roomId }) => {
      if (user.role !== "support_agent") return;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      if (room.claimedBy && room.claimedBy !== user.id) {
        socket.emit("chat:claim:error", { roomId, message: "Already claimed" });
        return;
      }
      room.claimedBy = user.id;
      room.updatedAt = new Date().toISOString();
      io.emit("chat:claim", { roomId, claimedBy: room.claimedBy });
    });

    socket.on("chat:release", ({ roomId }) => {
      if (user.role !== "support_agent") return;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      if (room.claimedBy && room.claimedBy !== user.id) return;
      room.claimedBy = null;
      room.updatedAt = new Date().toISOString();
      io.emit("chat:claim", { roomId, claimedBy: null });
    });

    socket.on("chat:getContext", async ({ roomId }) => {
      if (user.role !== "support_agent") return;
      const room = rooms.get(roomId);
      if (!room) return;

      if (!room.customerId || String(room.customerId).startsWith("guest_")) {
        socket.emit("chat:context", { roomId, guest: true });
        return;
      }

      try {
        const context = await buildCustomerContext(room.customerId);
        socket.emit("chat:context", { roomId, guest: false, context });
      } catch (err) {
        socket.emit("chat:context", { roomId, guest: false, error: "Failed to load context" });
      }
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
