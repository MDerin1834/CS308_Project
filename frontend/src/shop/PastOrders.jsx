import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
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

  return (
    <div>
      <PageHeader title="My Orders" curPage="Orders" />

      <div className="shop-cart padding-tb">
        <div className="container">
          <div className="section-wrapper">
            <div className="cart-top">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={2} className="text-center p-4">
                        Loading orders...
                      </td>
                    </tr>
                  )}

                  {error && (
                    <tr>
                      <td colSpan={2} className="text-center p-4 text-danger">
                        {error}
                      </td>
                    </tr>
                  )}

                  {!loading && !error && orders.length === 0 && (
                    <tr>
                      <td colSpan={2} className="text-center p-4">
                        You have no orders yet.
                      </td>
                    </tr>
                  )}

                  {orders.map((order, i) => {
                    const orderId = order.id || order._id || i;
                    const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A";
                    const total = Number(order.total || 0).toFixed(2);
                    const status = (order.status || "").replace(/-/g, " ");
                    const isProcessing = order.status === "processing";
                    const firstItem = order.items?.[0] || {};
                    const thumb = firstItem.imageURL || firstItem.img || "";
                    const itemCount =
                      order.items?.reduce((sum, item) => sum + (item.quantity ?? item.qty ?? 0), 0) ||
                      order.items?.length ||
                      0;

                    return (
                      <tr key={orderId}>
                        <td className="product-item">
                          <div className="p-thumb">
                            {thumb ? (
                              <img src={thumb} alt={firstItem.name || `Order ${orderId}`} />
                            ) : (
                              <div
                                style={{
                                  width: "80px",
                                  height: "80px",
                                  borderRadius: "8px",
                                  background: "#f5f5f5",
                                }}
                              />
                            )}
                          </div>

                          <div className="p-content">
                            <h5>Order {orderId}</h5>
                            <div className="wishlist-price">
                              <span className="normal-price">${total}</span>
                            </div>
                            <p className="mb-1">Placed on: {dateStr}</p>
                            <p className="mb-2 text-capitalize">Status: {status || "N/A"}</p>
                            <p className="mb-2">Items: {itemCount}</p>

                            {openOrder === orderId && (
                              <div className="mt-3">
                                {order.items?.map((item, index) => {
                                  const qty = item.quantity ?? item.qty ?? 0;
                                  const price = Number(item.unitPrice ?? item.price ?? 0).toFixed(2);
                                  const image = item.imageURL || item.img || "";
                                  return (
                                    <div key={index} className="d-flex align-items-center mb-2">
                                      {image ? (
                                        <img
                                          src={image}
                                          alt={item.name}
                                          style={{
                                            width: "50px",
                                            height: "50px",
                                            objectFit: "cover",
                                            borderRadius: "6px",
                                          }}
                                        />
                                      ) : (
                                        <div
                                          style={{
                                            width: "50px",
                                            height: "50px",
                                            background: "#f1f1f1",
                                            borderRadius: "6px",
                                          }}
                                        />
                                      )}
                                      <div className="ms-2">
                                        <div className="fw-semibold">{item.name}</div>
                                        <small className="text-muted">
                                          Qty: {qty} • ${price}
                                        </small>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </td>

                        <td>
                          <button className="lab-btn" onClick={() => toggleOrder(orderId)}>
                            {openOrder === orderId ? "Hide Details" : "View Details"}
                          </button>

                          {isProcessing && (
                            <button
                              className="btn btn-danger ms-2"
                              onClick={() => handleCancel(orderId)}
                              disabled={cancellingId === orderId}
                            >
                              {cancellingId === orderId ? "Cancelling..." : "Cancel Order"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PastOrders;
