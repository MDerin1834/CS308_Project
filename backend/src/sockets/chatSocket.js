const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const User = require("../models/User");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const ChatRoom = require("../models/ChatRoom");
const ChatMessage = require("../models/ChatMessage");

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
        participants: new Map(),
      });
    }
    return rooms.get(roomId);
  }

  function buildRoomSummary(room, dbRoom) {
    const participants = Array.from(room.participants.values()).map((p) => ({
      userId: p.userId,
      role: p.role,
    }));
    const hasCustomer = participants.some((p) => p.role === "customer" || p.role === "guest");
    return {
      roomId: dbRoom.roomId,
      participants,
      messageCount: dbRoom.messageCount || 0,
      updatedAt: dbRoom.updatedAt,
      claimedBy: dbRoom.claimedBy || null,
      hasCustomer,
      lastMessage: dbRoom.lastMessage
        ? { text: dbRoom.lastMessage, createdAt: dbRoom.lastMessageAt }
        : null,
    };
  }

  async function buildCustomerContext(userId, options = {}) {
    const limit = Number.isFinite(Number(options.limit)) ? Number(options.limit) : 5;
    const user = await User.findById(userId, {
      email: 1,
      username: 1,
      fullName: 1,
      homeAddress: 1,
    }).lean();

    const cart = await Cart.findOne({ userId }).lean();
    const ordersQuery = Order.find({ userId }).sort({ createdAt: -1 });
    const orders = limit > 0 ? await ordersQuery.limit(limit).lean() : await ordersQuery.lean();
    const wishlist = await Wishlist.findOne({ userId }).lean();
    const wishlistItems = Array.isArray(wishlist?.items) ? wishlist.items : [];
    const wishlistProductIds = wishlistItems.map((item) => item.productId).filter(Boolean);
    const wishlistProducts = wishlistProductIds.length
      ? await Product.find({ id: { $in: wishlistProductIds } }, { id: 1, name: 1, imageURL: 1, img: 1 }).lean()
      : [];
    const wishlistMap = new Map(wishlistProducts.map((p) => [p.id, p]));
    const wishlistDetails = wishlistItems.map((item) => {
      const product = wishlistMap.get(item.productId);
      return {
        productId: item.productId,
        name: product?.name || "",
        imageURL: product?.imageURL || product?.img || "",
        addedAt: item.addedAt,
      };
    });

    return {
      profile: user || null,
      cart: cart || { items: [] },
      orders: orders || [],
      wishlist: wishlist || { items: [] },
      wishlistItems: wishlistDetails,
    };
  }

  io.on("connection", (socket) => {
    const user = buildUserFromHandshake(socket);
    socket.data.user = user;

    socket.on("chat:request", async ({ roomId } = {}) => {
      const finalRoomId = roomId || `room_${Date.now()}_${Math.random().toString(16).slice(2)}`;

      const room = ensureRoom(finalRoomId);
      const update = { $setOnInsert: { createdBy: user.id } };
      if (user.role === "customer") {
        update.$set = { customerId: user.id };
      }
      await ChatRoom.findOneAndUpdate(
        { roomId: finalRoomId },
        update,
        { upsert: true, new: true }
      );

      socket.join(finalRoomId);
      room.participants.set(socket.id, {
        socketId: socket.id,
        userId: user.id,
        role: user.role,
        joinedAt: new Date().toISOString(),
      });

      socket.emit("chat:joined", { roomId: finalRoomId });
      const history = await ChatMessage.find({ roomId: finalRoomId })
        .sort({ createdAt: 1 })
        .limit(200)
        .lean();
      socket.emit("chat:history", { roomId: finalRoomId, messages: history });

      const dbRooms = await ChatRoom.find().sort({ updatedAt: -1 }).lean();
      const list = dbRooms.map((dbRoom) => buildRoomSummary(ensureRoom(dbRoom.roomId), dbRoom));
      io.emit("chat:rooms", { rooms: list });
    });

    socket.on("chat:join", async ({ roomId }) => {
      if (!roomId) return;

      const room = ensureRoom(roomId);
      socket.join(roomId);

      room.participants.set(socket.id, {
        socketId: socket.id,
        userId: user.id,
        role: user.role,
        joinedAt: new Date().toISOString(),
      });
      if (user.role === "customer") {
        await ChatRoom.findOneAndUpdate(
          { roomId },
          { $set: { customerId: user.id } },
          { upsert: true }
        );
      }

      const history = await ChatMessage.find({ roomId })
        .sort({ createdAt: 1 })
        .limit(200)
        .lean();
      socket.emit("chat:history", { roomId, messages: history });

      io.to(roomId).emit("chat:presence", {
        roomId,
        participants: Array.from(room.participants.values()).map((p) => ({
          userId: p.userId,
          role: p.role,
        })),
      });
    });

    socket.on("chat:message", async ({ roomId, text, attachments }) => {
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
      const created = await ChatMessage.create({
        roomId,
        senderId: msg.senderId,
        senderRole: msg.senderRole,
        text: msg.text,
        attachments: msg.attachments,
      });

      await ChatRoom.findOneAndUpdate(
        { roomId },
        {
          $set: {
            lastMessage: msg.text,
            lastMessageAt: new Date(),
          },
          $inc: { messageCount: 1 },
        },
        { upsert: true }
      );

      io.to(roomId).emit("chat:message", created.toJSON());
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

    socket.on("chat:listRooms", async () => {
      if (user.role !== "support_agent") {
        socket.emit("chat:rooms", { rooms: [] });
        return;
      }

      const dbRooms = await ChatRoom.find().sort({ updatedAt: -1 }).lean();
      const list = dbRooms.map((dbRoom) => buildRoomSummary(ensureRoom(dbRoom.roomId), dbRoom));

      socket.emit("chat:rooms", { rooms: list });
    });

    socket.on("chat:claim", async ({ roomId }) => {
      if (user.role !== "support_agent") return;
      if (!roomId) return;
      const dbRoom = await ChatRoom.findOne({ roomId });
      if (!dbRoom) return;
      if (dbRoom.claimedBy && dbRoom.claimedBy !== user.id) {
        socket.emit("chat:claim:error", { roomId, message: "Already claimed" });
        return;
      }
      dbRoom.claimedBy = user.id;
      await dbRoom.save();
      io.emit("chat:claim", { roomId, claimedBy: dbRoom.claimedBy });
    });

    socket.on("chat:release", async ({ roomId }) => {
      if (user.role !== "support_agent") return;
      if (!roomId) return;
      const dbRoom = await ChatRoom.findOne({ roomId });
      if (!dbRoom) return;
      if (dbRoom.claimedBy && dbRoom.claimedBy !== user.id) return;
      dbRoom.claimedBy = null;
      await dbRoom.save();
      io.emit("chat:claim", { roomId, claimedBy: null });
    });

    socket.on("chat:getContext", async ({ roomId, limit } = {}) => {
      if (user.role !== "support_agent") return;
      const dbRoom = await ChatRoom.findOne({ roomId });
      if (!dbRoom) return;

      if (!dbRoom.customerId || String(dbRoom.customerId).startsWith("guest_")) {
        socket.emit("chat:context", { roomId, guest: true });
        return;
      }

      try {
        const context = await buildCustomerContext(dbRoom.customerId, { limit });
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
