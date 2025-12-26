import React, { useContext, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Send } from "lucide-react";
import { AuthContext } from "../contexts/AuthProvider";
import { io } from "socket.io-client";
import api from "../api/client";

const AIChatbot = () => {
  const { user } = useContext(AuthContext);
  const canShow = !user || user.role === "customer";
  if (!canShow) return null;

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [messages, setMessages] = useState([]);
  const roomRef = useRef(null);
  const roomRequestRef = useRef(false);
  const pendingRef = useRef(null);
  const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5050";
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!isOpen || socket) return;
    const s = io(socketUrl, {
      auth: token ? { token } : undefined,
    });

    s.on("chat:joined", ({ roomId: joined }) => {
      setRoomId(joined);
      roomRef.current = joined;
      if (pendingRef.current) {
        const { text, attachments } = pendingRef.current;
        pendingRef.current = null;
        s.emit("chat:message", { roomId: joined, text, attachments });
      }
    });

    s.on("chat:history", ({ roomId: historyRoom, messages: history }) => {
      if (historyRoom !== roomRef.current) return;
      setMessages(Array.isArray(history) ? history : []);
    });

    s.on("chat:message", (msg) => {
      if (msg?.roomId !== roomRef.current) return;
      setMessages((prev) => [...prev, msg]);
    });

    const requestRoom = () => {
      if (roomRequestRef.current) return;
      roomRequestRef.current = true;
      s.emit("chat:request", {});
    };
    s.on("connect", requestRoom);
    requestRoom();

    s.on("connect_error", () => {
      setError("Unable to connect to support");
    });
    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
      setRoomId(null);
      roomRequestRef.current = false;
    };
  }, [isOpen, socketUrl, token]);

  useEffect(() => {
    if (socket && isOpen && !roomId) {
      if (!roomRequestRef.current) {
        roomRequestRef.current = true;
        socket.emit("chat:request", {});
      }
    }
  }, [socket, isOpen, roomId]);

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

  const handleSend = async () => {
    if (!roomId) {
      if (!roomRequestRef.current) {
        roomRequestRef.current = true;
        socket?.emit("chat:request", {});
      }
      if (input.trim() || attachment) {
        try {
          const attachments = attachment ? await uploadAttachment() : [];
          pendingRef.current = {
            text: input.trim(),
            attachments,
          };
          setInput("");
          setAttachment(null);
        } catch (err) {
          setError(err.message || "Failed to send message");
          return;
        }
      }
      setError("Connecting to support...");
      return;
    }
    if (!input.trim() && !attachment) return;
    setSending(true);
    setError("");
    try {
      const attachments = attachment ? await uploadAttachment() : [];
      socket?.emit("chat:message", {
        roomId,
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
        position: "fixed",
        bottom: "20px",
        left: "20px",
        width: "320px",
        zIndex: 9999,
      }}
    >
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          style={{
            backgroundColor: "#2563EB",
            color: "white",
            padding: "12px",
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
          }}
        >
          <MessageCircle size={24} />
        </motion.button>
      )}

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            width: "320px",
            height: "400px",
            backgroundColor: "white",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: "#2563EB",
              color: "white",
              padding: "10px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontWeight: "bold" }}>
              Live Support 👨‍💼
            </span>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "transparent",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              ✖
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "#f1f1f1",
                  color: "#000",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  maxWidth: "75%",
                }}
              >
                Hello 👋 How can we help you today?
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf:
                    msg.senderRole === "support_agent" ? "flex-start" : "flex-end",
                  backgroundColor:
                    msg.senderRole === "support_agent" ? "#f1f1f1" : "#2563EB",
                  color: msg.senderRole === "support_agent" ? "#000" : "#fff",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  maxWidth: "75%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {msg.text}
                {(msg.attachments || []).map((att, i) => (
                  <a
                    key={`${idx}-${i}`}
                    href={`${socketUrl}${att.url}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: msg.senderRole === "support_agent" ? "#1f2937" : "#fff",
                    }}
                  >
                    {att.name || "Attachment"}
                  </a>
                ))}
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{ display: "flex", borderTop: "1px solid #ddd" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Chat with support agent..."
              style={{
                flex: 1,
                border: "none",
                padding: "8px",
                outline: "none",
              }}
            />
            <input
              id="support-attach"
              type="file"
              onChange={handleAttachment}
              style={{ display: "none" }}
            />
            <label
              htmlFor="support-attach"
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
                  maxWidth: "140px",
                }}
                title={attachment.name}
              >
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "110px",
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
            <button
              onClick={handleSend}
              style={{
                backgroundColor: "#2563EB",
                color: "white",
                border: "none",
                padding: "0 12px",
              }}
              disabled={sending || !roomId}
            >
              {sending ? "..." : <Send size={18} />}
            </button>
          </div>
          {error && (
            <div style={{ color: "red", padding: "6px 10px", fontSize: "12px" }}>
              {error}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AIChatbot;
