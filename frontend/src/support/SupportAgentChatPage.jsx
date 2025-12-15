import React, { useState } from "react";
import { Send } from "lucide-react";

const SupportAgentChatPage = () => {
  // Mock customer data (later comes from backend / socket)
  const customer = {
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 555 234 5678",
    address: "123 Main St, Berlin, Germany",
  };

  const order = {
    orderId: "ORD-98231",
    status: "Paid",
    total: 249.99,
    items: [
      { name: "Wireless Headphones", qty: 1, price: 199.99 },
      { name: "USB-C Cable", qty: 1, price: 50.0 },
    ],
  };

  const [messages, setMessages] = useState([
    { sender: "customer", text: "Hi, I have a question about my order." },
    { sender: "agent", text: "Sure! How can I help you today?" },
  ]);

  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages([...messages, { sender: "agent", text: input }]);
    setInput("");
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
      {/* CUSTOMER PROFILE */}
      <div style={panelStyle}>
        <h4>Customer</h4>
        <p><strong>Name:</strong> {customer.name}</p>
        <p><strong>Email:</strong> {customer.email}</p>
        <p><strong>Phone:</strong> {customer.phone}</p>
        <p><strong>Address:</strong> {customer.address}</p>
      </div>

      {/* ORDER INFO */}
      <div style={panelStyle}>
        <h4>Order Info</h4>
        <p><strong>Order ID:</strong> {order.orderId}</p>
        <p><strong>Status:</strong> {order.status}</p>

        <h5 style={{ marginTop: "10px" }}>Items</h5>
        {order.items.map((item, idx) => (
          <div key={idx} style={{ fontSize: "14px" }}>
            {item.qty} × {item.name} — ${item.price.toFixed(2)}
          </div>
        ))}

        <hr />
        <strong>Total: ${order.total.toFixed(2)}</strong>
      </div>

      {/* CHAT */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid #ddd",
        }}
      >
        <div style={chatHeader}>Live Support Chat</div>

        <div style={chatBody}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                alignSelf:
                  msg.sender === "agent" ? "flex-end" : "flex-start",
                backgroundColor:
                  msg.sender === "agent" ? "#2563EB" : "#e5e7eb",
                color: msg.sender === "agent" ? "#fff" : "#000",
                padding: "8px 12px",
                borderRadius: "10px",
                maxWidth: "70%",
              }}
            >
              {msg.text}
            </div>
          ))}
        </div>

        <div style={chatInput}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your reply..."
            style={inputStyle}
          />
          <button onClick={sendMessage} style={sendBtn}>
            <Send size={18} />
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
