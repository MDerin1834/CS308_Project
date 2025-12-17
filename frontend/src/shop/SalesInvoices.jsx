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
  const [hoverPoint, setHoverPoint] = useState(null);

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

  const isExcludedOrder = (inv) =>
    inv?.status === "cancelled" ||
    inv?.refundRequestStatus === "approved" ||
    Boolean(inv?.refundedAt);

  const eligibleInvoices = invoices.filter((inv) => !isExcludedOrder(inv));

  const getLineTotal = (item) => {
    const qty = Number(item?.quantity ?? item?.qty ?? 0);
    const unit = Number(item?.unitPrice ?? item?.price ?? 0);
    const line = Number(item?.lineTotal ?? 0);
    return line || unit * qty;
  };

  const getItemCost = (item) => {
    const lineTotal = getLineTotal(item);
    const rawCost = Number(item?.cost ?? item?.unitCost ?? NaN);
    if (Number.isFinite(rawCost) && rawCost >= 0) {
      return rawCost * (item?.quantity ?? 1);
    }
    return lineTotal * 0.5;
  };

  const getOrderCost = (inv) =>
    (inv.items || []).reduce((sum, item) => sum + getItemCost(item), 0);

  const totalRevenue = eligibleInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalCost = eligibleInvoices.reduce((sum, inv) => sum + getOrderCost(inv), 0);
  const totalProfit = totalRevenue - totalCost;

  const dailyStats = eligibleInvoices.reduce((acc, inv) => {
    const paidAt = inv.paidAt || inv.createdAt;
    if (!paidAt) return acc;
    const key = new Date(paidAt).toISOString().split("T")[0];
    if (!acc[key]) {
      acc[key] = { date: key, revenue: 0, cost: 0, profit: 0 };
    }
    const revenue = Number(inv.total || 0);
    const cost = getOrderCost(inv);
    acc[key].revenue += revenue;
    acc[key].cost += cost;
    acc[key].profit += revenue - cost;
    return acc;
  }, {});

  const chartData = Object.values(dailyStats).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const chartWidth = 760;
  const chartHeight = 280;
  const chartPadding = 32;
  const values = chartData.flatMap((d) => [d.revenue, d.profit]);
  const maxValue = values.length ? Math.max(...values, 0) : 0;
  const minValue = values.length ? Math.min(...values, 0) : 0;
  const range = maxValue - minValue || 1;
  const xStep =
    chartData.length > 1
      ? (chartWidth - chartPadding * 2) / (chartData.length - 1)
      : 0;

  const pointFor = (idx, value) => {
    const x = chartPadding + idx * xStep;
    const y =
      chartHeight -
      chartPadding -
      ((value - minValue) / range) * (chartHeight - chartPadding * 2);
    return `${x},${y}`;
  };

  const revenueLine = chartData
    .map((d, idx) => pointFor(idx, d.revenue))
    .join(" ");
  const profitLine = chartData
    .map((d, idx) => pointFor(idx, d.profit))
    .join(" ");

  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => {
    const value = minValue + (range * i) / yTicks;
    return Number(value.toFixed(2));
  }).reverse();

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
            <strong>Eligible Invoices:</strong> {eligibleInvoices.length}
          </span>{" "}
          <span className="ms-3">
            <strong>Total Revenue:</strong> ${totalRevenue.toFixed(2)}
          </span>
          <span className="ms-3">
            <strong>Total Cost:</strong> ${totalCost.toFixed(2)}
          </span>
          <span className="ms-3">
            <strong>Total Profit:</strong> ${totalProfit.toFixed(2)}
          </span>
        </div>
        <div className="mb-4">
          <small className="text-muted">
            Revenue/profit excludes cancelled orders and approved refunds. Discounted orders are
            included because totals use the purchase price. Cost defaults to 50% of line total when
            item cost is not provided.
          </small>
        </div>

        <div className="mb-5">
          <h5 className="mb-3">Revenue vs Profit</h5>
          {chartData.length === 0 ? (
            <p className="text-muted">No data to chart for the selected range.</p>
          ) : (
            <div style={{ width: "100%", overflowX: "auto", position: "relative" }}>
              <div className="d-flex align-items-center gap-3 mb-2">
                <span className="d-flex align-items-center gap-2">
                  <span style={{ width: "12px", height: "12px", background: "#1f77b4" }}></span>
                  <small>Revenue</small>
                </span>
                <span className="d-flex align-items-center gap-2">
                  <span style={{ width: "12px", height: "12px", background: "#16a34a" }}></span>
                  <small>Profit</small>
                </span>
              </div>
              <svg
                width="100%"
                height={chartHeight}
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                role="img"
                aria-label="Revenue and profit chart"
              >
                <rect width={chartWidth} height={chartHeight} fill="#f8f9fb" />
                {tickValues.map((tick, idx) => {
                  const y =
                    chartPadding +
                    (idx * (chartHeight - chartPadding * 2)) / yTicks;
                  return (
                    <g key={`tick-${tick}`}>
                      <line
                        x1={chartPadding}
                        y1={y}
                        x2={chartWidth - chartPadding}
                        y2={y}
                        stroke="#e2e8f0"
                      />
                      <text x={6} y={y + 4} fontSize="11" fill="#64748b">
                        {tick.toFixed(2)}
                      </text>
                    </g>
                  );
                })}
                <line
                  x1={chartPadding}
                  y1={chartPadding}
                  x2={chartPadding}
                  y2={chartHeight - chartPadding}
                  stroke="#94a3b8"
                />
                <line
                  x1={chartPadding}
                  y1={chartHeight - chartPadding}
                  x2={chartWidth - chartPadding}
                  y2={chartHeight - chartPadding}
                  stroke="#94a3b8"
                />
                {revenueLine && (
                  <polyline
                    points={revenueLine}
                    fill="none"
                    stroke="#1f77b4"
                    strokeWidth="2"
                  />
                )}
                {profitLine && (
                  <polyline
                    points={profitLine}
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="2"
                  />
                )}
                {chartData.map((d, idx) => {
                  const cx = chartPadding + idx * xStep;
                  const revY =
                    chartHeight -
                    chartPadding -
                    ((d.revenue - minValue) / range) * (chartHeight - chartPadding * 2);
                  const profY =
                    chartHeight -
                    chartPadding -
                    ((d.profit - minValue) / range) * (chartHeight - chartPadding * 2);
                  return (
                    <g key={`pt-${d.date}`}>
                      <circle
                        cx={cx}
                        cy={revY}
                        r="4"
                        fill="#1f77b4"
                        onMouseEnter={() =>
                          setHoverPoint({
                            date: d.date,
                            revenue: d.revenue,
                            profit: d.profit,
                            x: cx,
                            y: revY,
                          })
                        }
                        onMouseLeave={() => setHoverPoint(null)}
                      />
                      <circle
                        cx={cx}
                        cy={profY}
                        r="4"
                        fill="#16a34a"
                        onMouseEnter={() =>
                          setHoverPoint({
                            date: d.date,
                            revenue: d.revenue,
                            profit: d.profit,
                            x: cx,
                            y: profY,
                          })
                        }
                        onMouseLeave={() => setHoverPoint(null)}
                      />
                      <text
                        x={cx}
                        y={chartHeight - 10}
                        fontSize="10"
                        fill="#64748b"
                        textAnchor="middle"
                      >
                        {d.date.slice(5)}
                      </text>
                    </g>
                  );
                })}
              </svg>
              {hoverPoint && (() => {
                const isRightEdge = hoverPoint.x > chartWidth * 0.75;
                return (
                <div
                  style={{
                    position: "absolute",
                    left: `${(hoverPoint.x / chartWidth) * 100}%`,
                    top: `${(hoverPoint.y / chartHeight) * 100}%`,
                    background: "#0f172a",
                    color: "#fff",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    pointerEvents: "none",
                    minWidth: "160px",
                    transform: `${isRightEdge ? "translate(calc(-100% - 12px), -50%)" : "translate(12px, -50%)"}`,
                    whiteSpace: "nowrap",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: "4px" }}>{hoverPoint.date}</div>
                  <div>Revenue: ${hoverPoint.revenue.toFixed(2)}</div>
                  <div>Profit: ${hoverPoint.profit.toFixed(2)}</div>
                </div>
                );
              })()}
            </div>
          )}
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
