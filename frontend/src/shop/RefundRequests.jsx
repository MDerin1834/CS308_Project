import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import api from "../api/client";

const RefundRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const loadRequests = () => {
    setLoading(true);
    setError("");
    api
      .get("/api/refunds/pending", { validateStatus: () => true })
      .then((res) => {
        if (res.status === 200 && Array.isArray(res.data?.items)) {
          setRequests(res.data.items);
        } else {
          setError(res.data?.message || "Failed to load refund requests");
        }
      })
      .catch((err) => setError(err?.response?.data?.message || "Failed to load refund requests"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAction = async (orderId, action) => {
    setUpdatingId(orderId);
    setError("");
    try {
      const res = await api.patch(`/api/refunds/${orderId}/${action}`, {}, { validateStatus: () => true });
      if (res.status === 200) {
        setRequests((prev) => prev.filter((o) => (o.id || o._id) !== orderId));
      } else {
        setError(res.data?.message || "Failed to update refund request");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update refund request");
    } finally {
      setUpdatingId(null);
    }
  };

  const getRefundItems = (order) =>
    Array.isArray(order.refundRequestedItems) && order.refundRequestedItems.length > 0
      ? order.refundRequestedItems
      : order.items || [];

  return (
    <div>
      <PageHeader title="Refund Requests" curPage="Sales Manager" />
      <div className="container py-5">
        <h2 className="mb-4">Pending Refunds</h2>
        {loading && <p>Loading refund requests...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {!loading && requests.length === 0 && !error && <p>No pending refund requests.</p>}

        {!loading && requests.length > 0 && (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Requested</th>
                  <th>Reason</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((order) => {
                  const orderId = order.id || order._id;
                  const customer =
                    order.shippingAddress?.fullName || order.userName || order.userId || "-";
                  const requestedAt = order.refundRequestedAt
                    ? new Date(order.refundRequestedAt).toLocaleString()
                    : "-";
                  const amount = Number(order.refundRequestAmount ?? order.total ?? 0).toFixed(2);
                  const items = getRefundItems(order);

                  return (
                    <tr key={orderId}>
                      <td>{orderId}</td>
                      <td>{customer}</td>
                      <td>{requestedAt}</td>
                      <td>{order.refundRequestReason || "-"}</td>
                      <td>
                        {items.length === 0 && <span>-</span>}
                        {items.map((item, idx) => (
                          <div key={`${item.productId}-${idx}`}>
                            {item.productId ? `[${item.productId}] ` : ""}
                            {item.name || "Item"} x {item.quantity || 0}
                          </div>
                        ))}
                      </td>
                      <td>${amount}</td>
                      <td className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleAction(orderId, "approve")}
                          disabled={updatingId === orderId}
                        >
                          {updatingId === orderId ? "Approving..." : "Approve"}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleAction(orderId, "reject")}
                          disabled={updatingId === orderId}
                        >
                          {updatingId === orderId ? "Rejecting..." : "Reject"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RefundRequests;
