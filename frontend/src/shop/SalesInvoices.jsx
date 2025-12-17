import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import api from "../api/client";

const SalesInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  const loadInvoices = async (filters = {}) => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await api.get("/api/payment/invoices", {
        params,
        validateStatus: () => true,
      });
      if (res.status === 200 && Array.isArray(res.data?.invoices)) {
        setInvoices(res.data.invoices);
      } else {
        setError(res.data?.message || "Failed to load invoices");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadInvoices({ startDate, endDate });
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    loadInvoices({ startDate: "", endDate: "" });
  };

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
        setError(res.data?.message || "Failed to export invoice PDF");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to export invoice PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString() : "-";

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

  return (
    <div>
      <PageHeader title="Sales Manager" curPage="Invoices" />
      <div className="container py-5">
        <h2 className="mb-4">Invoice List</h2>
        <form className="row g-3 align-items-end mb-4" onSubmit={handleFilterSubmit}>
          <div className="col-sm-6 col-md-4">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="col-sm-6 col-md-4">
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="col-sm-6 col-md-4 d-flex gap-2">
            <button className="btn btn-primary" type="submit">
              Apply Filters
            </button>
            <button className="btn btn-outline-secondary" type="button" onClick={handleClearFilters}>
              Clear
            </button>
          </div>
        </form>

        <div className="mb-3">
          <strong>Total Invoices:</strong> {invoices.length}{" "}
          <span className="ms-3">
            <strong>Total Revenue:</strong> ${totalRevenue.toFixed(2)}
          </span>
        </div>

        {loading && <p>Loading invoices...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {!loading && invoices.length === 0 && !error && <p>No invoices found.</p>}

        {!loading && invoices.length > 0 && (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Paid Date</th>
                  <th>Total</th>
                  <th>Export</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const orderId = inv.id || inv._id;
                  const customer =
                    inv.shippingAddress?.fullName || inv.userName || inv.userId || "-";
                  return (
                    <tr key={orderId}>
                      <td>{inv.invoiceNumber || "-"}</td>
                      <td>{orderId}</td>
                      <td>{customer}</td>
                      <td>{formatDate(inv.paidAt)}</td>
                      <td>${Number(inv.total || 0).toFixed(2)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleDownload(orderId, inv.invoiceNumber)}
                          disabled={downloadingId === orderId}
                        >
                          {downloadingId === orderId ? "Exporting..." : "Export PDF"}
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

export default SalesInvoices;
