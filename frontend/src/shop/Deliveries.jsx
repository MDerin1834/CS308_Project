import React, { useEffect, useState } from "react";
import api from "../api/client";
import PageHeader from "../components/PageHeader";

const statusOptions = ["processing", "in-transit", "delivered", "cancelled"];

const Deliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const loadDeliveries = () => {
    setLoading(true);
    setError("");
    api
      .get("/api/orders/deliveries", { validateStatus: () => true })
      .then((res) => {
        if (res.status === 200 && Array.isArray(res.data?.deliveries)) {
          setDeliveries(res.data.deliveries);
        } else {
          setError(res.data?.message || "Failed to load deliveries");
        }
      })
      .catch((err) => setError(err?.response?.data?.message || "Failed to load deliveries"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    setError("");
    try {
      const res = await api.patch(
        `/api/orders/${id}/status`,
        { status: newStatus },
        { validateStatus: () => true }
      );
      if (res.status === 200) {
        setDeliveries((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: newStatus, completion: newStatus === "delivered" } : d))
        );
      } else {
        setError(res.data?.message || "Failed to update status");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatAddress = (addr = {}) =>
    [addr.fullName, addr.addressLine1, addr.addressLine2, addr.city, addr.country, addr.postalCode]
      .filter(Boolean)
      .join(", ");

  const handleDownload = async (orderId, invoiceNumber) => {
    setDownloadingId(orderId);
    setError("");
    try {
      const res = await api.get(`/api/payment/invoices/${orderId}/pdf`, {
        responseType: "blob",
        validateStatus: () => true,
      });
      if (res.status === 200) {
        const blob = new Blob([res.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${invoiceNumber || orderId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        setError(res.data?.message || "Failed to download invoice");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to download invoice");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div>
      <PageHeader title="Product Manager" curPage="Deliveries" />
      <div className="container padding-tb">
        {loading && <p>Loading deliveries...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {!loading && deliveries.length === 0 && !error && <p>No deliveries found.</p>}

        {!loading && deliveries.length > 0 && (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead>
                <tr>
                  <th>Delivery ID</th>
                  <th>Customer ID</th>
                  <th>Customer Username</th>
                  <th>Invoice</th>
                  <th>Products</th>
                  <th>Total</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={d.id}>
                    <td>{d.id}</td>
                    <td>{d.customerId || "-"}</td>
                    <td>{d.customerUsername || "-"}</td>
                    <td>
                      <div>{d.invoiceNumber || "-"}</div>
                      {d.invoiceNumber && (
                        <button
                          className="btn btn-sm btn-outline-primary mt-1"
                          onClick={() => handleDownload(d.id, d.invoiceNumber)}
                          disabled={downloadingId === d.id}
                        >
                          {downloadingId === d.id ? "Downloading..." : "Download PDF"}
                        </button>
                      )}
                    </td>
                    <td>
                      {d.items?.map((item, idx) => (
                        <div key={idx}>
                          {item.productId ? `[${item.productId}] ` : ""}
                          {item.name || ""} x {item.quantity} ({item.lineTotal ? `$${item.lineTotal}` : ""})
                        </div>
                      ))}
                    </td>
                    <td>${Number(d.total || 0).toFixed(2)}</td>
                    <td>{formatAddress(d.shippingAddress)}</td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={d.status}
                        onChange={(e) => handleStatusChange(d.id, e.target.value)}
                        disabled={updatingId === d.id}
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{d.completion ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Deliveries;
