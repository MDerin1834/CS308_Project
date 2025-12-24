import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../contexts/AuthProvider";
import api from "../api/client";

const panelStyle = {
  position: "absolute",
  right: 0,
  top: "120%",
  width: "320px",
  maxHeight: "420px",
  overflowY: "auto",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
  zIndex: 2000,
  padding: "12px",
};

const NotificationBell = () => {
  const { user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/wishlist/discounts", { validateStatus: () => true });
      if (res.status === 200 && Array.isArray(res.data?.items)) {
        setItems(res.data.items);
      } else {
        setError(res.data?.message || "Failed to load notifications");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && user) {
      fetchNotifications();
    }
  }, [open, user]);

  useEffect(() => {
    const closeOnOutsideClick = (e) => {
      if (open) {
        const panel = document.getElementById("notif-panel");
        const trigger = document.getElementById("notif-trigger");
        if (panel && !panel.contains(e.target) && trigger && !trigger.contains(e.target)) {
          setOpen(false);
        }
      }
    };
    document.addEventListener("click", closeOnOutsideClick);
    return () => document.removeEventListener("click", closeOnOutsideClick);
  }, [open]);

  const unreadCount = items.length;

  const clearNotifications = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/wishlist/discounts/clear", {}, { validateStatus: () => true });
      if (res.status === 200) {
        setItems([]);
      } else {
        setError(res.data?.message || "Failed to clear notifications");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to clear notifications");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="position-relative d-inline-block">
      <button
        id="notif-trigger"
        className="btn btn-link text-decoration-none position-relative p-0 me-3"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <i className="icofont-notification" style={{ fontSize: "20px" }}></i>
        {unreadCount > 0 && (
          <span
            className="badge bg-danger position-absolute"
            style={{ top: "-6px", right: "-10px" }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div id="notif-panel" style={panelStyle}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong>Discounts</strong>
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={fetchNotifications}
                disabled={loading}
              >
                {loading ? "..." : "Refresh"}
              </button>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={clearNotifications}
                disabled={items.length === 0}
              >
                Clear
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger py-2">{error}</div>}
          {loading && <p className="mb-0">Loading...</p>}
          {!loading && !error && items.length === 0 && (
            <p className="text-muted mb-0">No discount notifications.</p>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="list-group">
              {items.map((item) => (
                <Link
                  to={`/shop/${item.productId}`}
                  key={item.productId}
                  className="list-group-item list-group-item-action d-flex gap-2 align-items-start"
                  onClick={() => setOpen(false)}
                >
                  {item.imageURL ? (
                    <img
                      src={item.imageURL}
                      alt={item.name}
                      style={{
                        width: "48px",
                        height: "48px",
                        objectFit: "cover",
                        borderRadius: "6px",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "6px",
                        background: "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94a3b8",
                        flexShrink: 0,
                        fontSize: "12px",
                      }}
                    >
                      N/A
                    </div>
                  )}
                  <div className="flex-grow-1">
                    <div className="fw-semibold">{item.name}</div>
                    <div style={{ fontSize: "13px" }}>
                      Now ${Number(item.currentPrice ?? 0).toFixed(2)} (was ${Number(item.basePrice ?? 0).toFixed(2)})
                    </div>
                    <small className="text-success">-{Number(item.discountPercent ?? 0)}%</small>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
