import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import api from "../api/client";

const SupportAgentChatPage = () => {
  const [socket, setSocket] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [context, setContext] = useState(null);
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const activeRoomRef = useRef(null);

  const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5050";
  const token = localStorage.getItem("token");

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  useEffect(() => {
    const s = io(socketUrl, {
      auth: token ? { token } : undefined,
    });

    s.on("connect", () => {
      s.emit("chat:listRooms");
    });

    s.on("chat:rooms", ({ rooms: list }) => {
      setRooms(Array.isArray(list) ? list : []);
      setLoadingRooms(false);
    });

    s.on("chat:history", ({ roomId, messages: history }) => {
      if (roomId !== activeRoomRef.current) return;
      setMessages(Array.isArray(history) ? history : []);
    });

    s.on("chat:message", (msg) => {
      if (msg?.roomId !== activeRoomRef.current) return;
      setMessages((prev) => [...prev, msg]);
    });

    s.on("chat:claim", ({ roomId, claimedBy }) => {
      setRooms((prev) =>
        prev.map((room) =>
          room.roomId === roomId ? { ...room, claimedBy } : room
        )
      );
    });

    s.on("chat:context", ({ roomId, context: ctx }) => {
      if (roomId !== activeRoomRef.current) return;
      setContext(ctx || null);
    });

    s.on("disconnect", () => {
      setSocket(null);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [socketUrl, token]);

  const refreshRooms = () => {
    setLoadingRooms(true);
    socket?.emit("chat:listRooms");
  };

  const joinRoom = (roomId) => {
    setActiveRoom(roomId);
    setMessages([]);
    setContext(null);
    socket?.emit("chat:join", { roomId });
    socket?.emit("chat:getContext", { roomId });
  };

  const claimRoom = () => {
    if (!activeRoom) return;
    socket?.emit("chat:claim", { roomId: activeRoom });
  };

  const releaseRoom = () => {
    if (!activeRoom) return;
    socket?.emit("chat:release", { roomId: activeRoom });
  };

  const handleAttachment = (e) => {
    setAttachment(e.target.files?.[0] || null);
  };

  const uploadAttachment = async () => {
    if (!attachment) return [];
    const formData = new FormData();
    formData.append("file", attachment);
    const res = await api.post("/api/support/attachments", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      validateStatus: () => true,
    });
    if (res.status === 201 && res.data?.attachment) {
      return [res.data.attachment];
    }
    throw new Error(res.data?.message || "Failed to upload attachment");
  };

  const sendMessage = async () => {
    if (!activeRoom || (!input.trim() && !attachment)) return;
    setSending(true);
    setError("");
    try {
      const attachments = attachment ? await uploadAttachment() : [];
      socket?.emit("chat:message", {
        roomId: activeRoom,
        text: input.trim(),
        attachments,
      });
      setInput("");
      setAttachment(null);
    } catch (err) {
      setError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "280px 320px 1fr",
        height: "100vh",
        backgroundColor: "#f9fafb",
      }}
    >
      {/* ROOM QUEUE */}
      <div style={panelStyle}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Queue</h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={refreshRooms}>
            Refresh
          </button>
        </div>
        {loadingRooms && <p className="text-muted">Loading rooms...</p>}
        {!loadingRooms && rooms.length === 0 && (
          <p className="text-muted">No active chats.</p>
        )}
        <div className="list-group">
          {rooms.map((room) => (
            <button
              key={room.roomId}
              className={`list-group-item list-group-item-action ${
                room.roomId === activeRoom ? "active" : ""
              }`}
              onClick={() => joinRoom(room.roomId)}
              type="button"
            >
              <div className="fw-semibold">{room.roomId}</div>
              <small>
                {room.claimedBy ? "Claimed" : "Unclaimed"} • {room.messageCount} msgs
              </small>
            </button>
          ))}
        </div>
      </div>

      {/* CUSTOMER CONTEXT */}
      <div style={panelStyle}>
        <h5>Customer Context</h5>
        {!activeRoom && <p className="text-muted">Select a chat to view details.</p>}
        {activeRoom && !context && (
          <p className="text-muted">Loading customer context...</p>
        )}
        {context && (
          <>
            <div className="mb-3">
              <strong>Profile</strong>
              <div>{context.profile?.username || context.profile?.fullName || "-"}</div>
              <div>{context.profile?.email || "-"}</div>
            </div>
            <div className="mb-3">
              <strong>Cart</strong>
              <div>{context.cart?.items?.length || 0} items</div>
            </div>
            <div className="mb-3">
              <strong>Recent Orders</strong>
              {(context.orders || []).slice(0, 3).map((order) => (
                <div key={order._id || order.id}>
                  {order.status} • ${Number(order.total || 0).toFixed(2)}
                </div>
              ))}
            </div>
            <div>
              <strong>Wishlist</strong>
              <div>{context.wishlist?.items?.length || 0} items</div>
            </div>
          </>
        )}
      </div>

      {/* CHAT */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid #ddd",
        }}
      >
        <div style={chatHeader}>
          <div>Live Support Chat</div>
          {activeRoom && (
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-light" onClick={claimRoom}>
                Claim
              </button>
              <button className="btn btn-sm btn-outline-light" onClick={releaseRoom}>
                Release
              </button>
            </div>
          )}
        </div>

        <div style={chatBody}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                alignSelf:
                  msg.senderRole === "support_agent" ? "flex-end" : "flex-start",
                backgroundColor:
                  msg.senderRole === "support_agent" ? "#2563EB" : "#e5e7eb",
                color: msg.senderRole === "support_agent" ? "#fff" : "#000",
                padding: "8px 12px",
                borderRadius: "10px",
                maxWidth: "75%",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              {msg.text && <div>{msg.text}</div>}
              {(msg.attachments || []).map((att, idx) => (
                <a
                  key={`${msg.id}-${idx}`}
                  href={`${socketUrl}${att.url}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: msg.senderRole === "support_agent" ? "#fff" : "#1f2937" }}
                >
                  {att.name || "Attachment"}
                </a>
              ))}
            </div>
          ))}
        </div>

        {error && <div className="text-danger px-3 pb-2">{error}</div>}

        <div style={chatInput}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your reply..."
            style={inputStyle}
            disabled={!activeRoom}
          />
          <input
            id="support-agent-attach"
            type="file"
            onChange={handleAttachment}
            style={{ display: "none" }}
          />
          <label
            htmlFor="support-agent-attach"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 12px",
              cursor: "pointer",
              borderLeft: "1px solid #e5e7eb",
              color: "#2563EB",
              background: "#fff",
            }}
            title={attachment ? attachment.name : "Attach file"}
          >
            📎
          </label>
          {attachment && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "0 8px",
                fontSize: "12px",
                color: "#64748b",
                maxWidth: "180px",
              }}
              title={attachment.name}
            >
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "140px",
                }}
              >
                {attachment.name}
              </span>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#94a3b8",
                }}
                title="Remove attachment"
              >
                ✖
              </button>
            </div>
          )}
          <button onClick={sendMessage} style={sendBtn} disabled={!activeRoom || sending}>
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- STYLES ---------------- */

const panelStyle = {
  padding: "16px",
  borderRight: "1px solid #ddd",
  backgroundColor: "#fff",
};

const chatHeader = {
  padding: "12px",
  backgroundColor: "#2563EB",
  color: "#fff",
  fontWeight: "bold",
};

const chatBody = {
  flex: 1,
  padding: "12px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  overflowY: "auto",
};

const chatInput = {
  display: "flex",
  borderTop: "1px solid #ddd",
};

const inputStyle = {
  flex: 1,
  padding: "10px",
  border: "none",
  outline: "none",
};

const sendBtn = {
  backgroundColor: "#2563EB",
  color: "#fff",
  border: "none",
  padding: "0 16px",
  cursor: "pointer",
};

export default SupportAgentChatPage;
