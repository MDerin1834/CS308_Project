import React, { useEffect, useState } from "react";
import "./PastOrders.css";
import api from "../api/client";

const PastOrders = () => {
  const [orders, setOrders] = useState([]);
  const [openOrder, setOpenOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const loadOrders = () => {
    setLoading(true);
    setError("");
    api
      .get("/api/orders/my-orders", { validateStatus: () => true })
      .then((res) => {
        if (res.status === 200 && Array.isArray(res.data?.orders)) {
          setOrders(res.data.orders);
        } else {
          setError(res.data?.message || "Could not load orders");
        }
      })
      .catch((err) => setError(err?.response?.data?.message || "Could not load orders"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const toggleOrder = (id) => setOpenOrder(openOrder === id ? null : id);

  const handleCancel = async (orderId) => {
    setCancellingId(orderId);
    setError("");
    try {
      const res = await api.patch(`/api/orders/${orderId}/cancel`, {}, { validateStatus: () => true });
      if (res.status === 200) {
        loadOrders();
      } else {
        setError(res.data?.message || "Failed to cancel order");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to cancel order");
    } finally {
      setCancellingId(null);
    }
  };

  const visibleOrders = orders.filter((o) => (o.status || "").toLowerCase() !== "cancelled");

  return (
    <div className="orders-container">
      <h1 className="orders-title">My Orders</h1>
      {loading && <p>Loading orders...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && visibleOrders.length === 0 && !error && <p>You have no orders yet.</p>}

      {visibleOrders.map((order) => {
        const orderId = order.id || order._id;
        const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A";
        const total = Number(order.total || 0).toFixed(2);
        const status = (order.status || "").replace(/-/g, " ");
        const isProcessing = order.status === "processing";
        return (
          <div key={orderId} className="order-card">
            <div className="order-summary" onClick={() => toggleOrder(orderId)}>
              <div>
                <h3>Order {orderId}</h3>
                <p>Date: {dateStr}</p>
                <p>Status: {status}</p>
              </div>
              <div className="order-total">
                <h3>${total}</h3>
                <span className="toggle-btn">{openOrder === orderId ? "▲" : "▼"}</span>
              </div>
            </div>

            {openOrder === orderId && (
              <div className="order-details">
                {order.items?.map((item, index) => {
                  const qty = item.quantity ?? item.qty ?? 0;
                  const price = Number(item.unitPrice ?? item.price ?? 0).toFixed(2);
                  const image = item.imageURL || item.img || "";
                  return (
                    <div className="order-item" key={index}>
                      {image ? <img src={image} alt={item.name} /> : <div className="order-item-placeholder" />}
                      <div className="item-info">
                        <h4>{item.name}</h4>
                        <p>Quantity: {qty}</p>
                        <p>Price: ${price}</p>
                      </div>
                    </div>
                  );
                })}
                {isProcessing && (
                  <div className="order-actions">
                    <button
                      className="cancel-btn"
                      onClick={() => handleCancel(orderId)}
                      disabled={cancellingId === orderId}
                    >
                      {cancellingId === orderId ? "Cancelling..." : "Cancel Order"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PastOrders;
