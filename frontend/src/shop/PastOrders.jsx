import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import api from "../api/client";

const PastOrders = () => {
  const [orders, setOrders] = useState([]);
  const [openOrder, setOpenOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [refundSubmittingId, setRefundSubmittingId] = useState(null);
  const [refundSelection, setRefundSelection] = useState({});
  const [refundReason, setRefundReason] = useState({});
  const [refundFeedback, setRefundFeedback] = useState({});

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
  const openOrderDetails = (id) => setOpenOrder(id);

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

  const getPurchaseDate = (order) => order.paidAt || order.createdAt;

  const isRefundEligible = (order) => {
    if (order.status !== "delivered") return false;
    const purchaseDate = getPurchaseDate(order);
    if (!purchaseDate) return false;
    const daysSince = (Date.now() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 30;
  };

  const hasRefundRequest = (order) => Boolean(order.refundRequestedAt);

  const toggleRefundItem = (orderId, productId) => {
    setRefundSelection((prev) => {
      const current = prev[orderId] || {};
      const next = { ...current, [productId]: !current[productId] };
      return { ...prev, [orderId]: next };
    });
  };

  const handleRefundRequest = async (order) => {
    const orderId = order.id || order._id;
    const selected = refundSelection[orderId] || {};
    const selectedItems = (order.items || []).filter((item) => selected[item.productId]);

    if (selectedItems.length === 0) {
      setRefundFeedback((prev) => ({
        ...prev,
        [orderId]: { type: "error", message: "Please select at least one item to refund." },
      }));
      return;
    }

    setRefundSubmittingId(orderId);
    setRefundFeedback((prev) => ({ ...prev, [orderId]: null }));
    try {
      const payload = {
        orderId,
        items: selectedItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        reason: refundReason[orderId] || "",
      };

      const res = await api.post("/api/refunds", payload, { validateStatus: () => true });
      if (res.status === 200) {
        setOrders((prev) =>
          prev.map((o) =>
            (o.id || o._id) === orderId
              ? {
                  ...o,
                  refundRequestedAt: new Date().toISOString(),
                  refundRequestStatus: "pending",
                  refundRequestReason: payload.reason,
                }
              : o
          )
        );
        setRefundSelection((prev) => ({ ...prev, [orderId]: {} }));
        setRefundFeedback((prev) => ({
          ...prev,
          [orderId]: { type: "success", message: "Refund request submitted." },
        }));
      } else {
        setRefundFeedback((prev) => ({
          ...prev,
          [orderId]: { type: "error", message: res.data?.message || "Refund request failed." },
        }));
      }
    } catch (err) {
      setRefundFeedback((prev) => ({
        ...prev,
        [orderId]: { type: "error", message: err?.response?.data?.message || "Refund request failed." },
      }));
    } finally {
      setRefundSubmittingId(null);
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
                    const refundable = isRefundEligible(order);
                    const refundRequested = hasRefundRequest(order);
                    const firstItem = order.items?.[0] || {};
                    const thumb = firstItem.imageURL || firstItem.img || "";
                    const itemCount =
                      order.items?.reduce((sum, item) => sum + (item.quantity ?? item.qty ?? 0), 0) ||
                      order.items?.length ||
                      0;
                    const refundStatus = refundRequested ? order.refundRequestStatus || "pending" : "";

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
                            {refundRequested && (
                              <p className="mb-2 text-capitalize">
                                Refund status: {refundStatus}
                              </p>
                            )}

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
                                {refundable && !refundRequested && (
                                  <div className="mt-3 border-top pt-3">
                                    <h6>Request a Refund</h6>
                                    <p className="mb-2 text-muted">
                                      Select items to return (within 30 days of purchase).
                                    </p>
                                    {order.items?.map((item) => {
                                      const checked =
                                        refundSelection[orderId]?.[item.productId] || false;
                                      return (
                                        <div className="form-check" key={item.productId}>
                                          <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id={`refund-${orderId}-${item.productId}`}
                                            checked={checked}
                                            onChange={() => toggleRefundItem(orderId, item.productId)}
                                          />
                                          <label
                                            className="form-check-label"
                                            htmlFor={`refund-${orderId}-${item.productId}`}
                                          >
                                            {item.name} x {item.quantity} • $
                                            {Number(item.lineTotal || 0).toFixed(2)}
                                          </label>
                                        </div>
                                      );
                                    })}
                                    <textarea
                                      className="form-control mt-2"
                                      rows="2"
                                      placeholder="Reason (optional)"
                                      value={refundReason[orderId] || ""}
                                      onChange={(e) =>
                                        setRefundReason((prev) => ({
                                          ...prev,
                                          [orderId]: e.target.value,
                                        }))
                                      }
                                    />
                                    <button
                                      className="btn btn-outline-danger mt-2"
                                      onClick={() => handleRefundRequest(order)}
                                      disabled={refundSubmittingId === orderId}
                                    >
                                      {refundSubmittingId === orderId ? "Submitting..." : "Request Refund"}
                                    </button>
                                    {refundFeedback[orderId] && (
                                      <p
                                        className="mt-2"
                                        style={{
                                          color:
                                            refundFeedback[orderId].type === "error"
                                              ? "red"
                                              : "green",
                                        }}
                                      >
                                        {refundFeedback[orderId].message}
                                      </p>
                                    )}
                                  </div>
                                )}
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
                          {refundable && !refundRequested && (
                            <button
                              className="btn btn-outline-danger ms-2"
                              onClick={() => openOrderDetails(orderId)}
                            >
                              Request Refund
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
