import React, { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Send } from "lucide-react";

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");

  // Unique conversation ID (later sent to backend)
  const [conversationId] = useState(() => crypto.randomUUID());

  const [isHumanHandoff, setIsHumanHandoff] = useState(false);

  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello 👋 How can I help you today?" },
  ]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    if (isHumanHandoff) {
      // 🔹 This is where backend socket/API would send message to agent
      console.log("Send to human agent:", {
        conversationId,
        text: input,
      });
      return;
    }

    // Temporary AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text:
            "I may need to connect you with a human support agent. Please wait… 👨‍💼",
        },
      ]);

      // 🔹 Trigger handoff
      setIsHumanHandoff(true);

      // 🔹 Backend request placeholder
      console.log("Handoff requested:", {
        conversationId,
        messages: [...messages, userMessage],
      });
    }, 800);
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
              {isHumanHandoff ? "Live Support 👨‍💼" : "AI Assistant 🤖"}
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
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf:
                    msg.sender === "bot" ? "flex-start" : "flex-end",
                  backgroundColor:
                    msg.sender === "bot" ? "#f1f1f1" : "#2563EB",
                  color: msg.sender === "bot" ? "#000" : "#fff",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  maxWidth: "75%",
                }}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{ display: "flex", borderTop: "1px solid #ddd" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                isHumanHandoff
                  ? "Chat with support agent..."
                  : "Ask me something..."
              }
              style={{
                flex: 1,
                border: "none",
                padding: "8px",
                outline: "none",
              }}
            />
            <button
              onClick={handleSend}
              style={{
                backgroundColor: "#2563EB",
                color: "white",
                border: "none",
                padding: "0 12px",
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AIChatbot;
