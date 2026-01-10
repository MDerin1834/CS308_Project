import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import api from "../api/client";

const DiscountManager = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [inputs, setInputs] = useState({});
  const [search, setSearch] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/products", {
        params: { limit: 400, sort: "newest", search: search || undefined },
        validateStatus: () => true,
      });
      if (res.status === 200 && Array.isArray(res.data?.items)) {
        setProducts(res.data.items);
      } else {
        setError(res.data?.message || "Failed to load products");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (id, field, value) => {
    setInputs((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value },
    }));
  };

  const updateProductInState = (nextProduct) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === nextProduct.id ? { ...p, ...nextProduct } : p))
    );
  };

  const handleApply = async (product) => {
    const raw = inputs[product.id] || {};
    const payload = {};

    if (raw.percent) {
      payload.discountPercent = Number(raw.percent);
    }
    if (raw.price) {
      payload.discountPrice = Number(raw.price);
    }

    if (!payload.discountPercent && !payload.discountPrice) {
      setFeedback("Enter a percent or price to apply a discount.");
      return;
    }

    setSavingId(product.id);
    setFeedback("");
    try {
      const res = await api.patch(`/api/products/${product.id}/discount`, payload, {
        validateStatus: () => true,
      });
      if (res.status === 200 && res.data?.product) {
        updateProductInState(res.data.product);
        const notified = res.data?.wishlistNotifications;
        const suffix =
          typeof notified === "number" && notified > 0
            ? ` Wishlist notifications sent to ${notified} customer(s).`
            : "";
        setFeedback(`Discount applied to ${product.name}.${suffix}`);
      } else {
        setFeedback(res.data?.message || "Could not apply discount.");
      }
    } catch (err) {
      setFeedback(err?.response?.data?.message || "Could not apply discount.");
    } finally {
      setSavingId(null);
    }
  };

  const handleClear = async (product) => {
    setSavingId(product.id);
    setFeedback("");
    try {
      const res = await api.patch(
        `/api/products/${product.id}/discount`,
        { clear: true },
        { validateStatus: () => true }
      );
      if (res.status === 200 && res.data?.product) {
        updateProductInState(res.data.product);
        setInputs((prev) => ({ ...prev, [product.id]: { percent: "", price: "" } }));
        setFeedback(`Cleared discount for ${product.name}.`);
      } else {
        setFeedback(res.data?.message || "Could not clear discount.");
      }
    } catch (err) {
      setFeedback(err?.response?.data?.message || "Could not clear discount.");
    } finally {
      setSavingId(null);
    }
  };

  const handleSetPrice = async (product) => {
    const raw = inputs[product.id] || {};
    const nextPrice = Number(raw.basePrice);
    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      setFeedback("Enter a valid base price.");
      return;
    }

    setSavingId(product.id);
    setFeedback("");
    try {
      const res = await api.patch(
        `/api/products/${product.id}/price`,
        { price: nextPrice },
        { validateStatus: () => true }
      );
      if (res.status === 200 && res.data?.product) {
        updateProductInState(res.data.product);
        setInputs((prev) => ({ ...prev, [product.id]: { ...(prev[product.id] || {}), basePrice: "" } }));
        setFeedback(`Price updated for ${product.name}.`);
      } else {
        setFeedback(res.data?.message || "Could not update price.");
      }
    } catch (err) {
      setFeedback(err?.response?.data?.message || "Could not update price.");
    } finally {
      setSavingId(null);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    const term = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term) ||
        p.seller?.toLowerCase().includes(term)
    );
  }, [products, search]);

  return (
    <div>
      <PageHeader title="Sales Manager" curPage="Discounts" />
      <div className="container py-5">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
          <div>
            <h2 className="mb-0">Manage Discounts</h2>
            <small className="text-muted">
              Apply percentage or price-based discounts. Clearing restores the original price.
            </small>
          </div>
          <div className="d-flex gap-2">
            <Link to="/sales/invoices" className="btn btn-outline-secondary">
              View Invoices
            </Link>
            <Link to="/shop" className="btn btn-primary">
              Go to Shop
            </Link>
          </div>
        </div>

        <div className="row g-2 mb-3">
          <div className="col-sm-8 col-md-6">
            <input
              type="search"
              className="form-control"
              placeholder="Search by name, category, or seller"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-sm-4 col-md-3">
            <button className="btn btn-outline-primary w-100" onClick={loadProducts} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {feedback && <div className="alert alert-info py-2">{feedback}</div>}
        {error && <div className="alert alert-danger py-2">{error}</div>}

        {loading ? (
          <p>Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-muted">No products found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th>Image</th>
                  <th style={{ minWidth: "180px" }}>Product</th>
                  <th>Category</th>
                  <th>Seller</th>
                  <th>Base Price</th>
                  <th>Current Price</th>
                  <th>Discount</th>
                  <th style={{ minWidth: "220px" }}>Set Discount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const rowInput = inputs[product.id] || {};
                  const hasDiscount = Number.isFinite(product.discountPercent) && product.discountPercent > 0;
                  const basePrice = Number(product.originalPrice ?? product.price ?? 0);
                  return (
                    <tr key={product.id}>
                      <td style={{ width: "90px" }}>
                        <div
                          style={{
                            width: "72px",
                            height: "72px",
                            borderRadius: "8px",
                            overflow: "hidden",
                            border: "1px solid #e5e7eb",
                            background: "#fff",
                          }}
                        >
                          {product.imageURL || product.img ? (
                            <img
                              src={product.imageURL || product.img}
                              alt={product.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <div
                              className="d-flex align-items-center justify-content-center h-100 text-muted"
                              style={{ fontSize: "12px" }}
                            >
                              No image
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold">{product.name}</div>
                        <small className="text-muted">Stock: {product.stock ?? 0}</small>
                      </td>
                      <td>{product.category || "-"}</td>
                      <td>{product.seller || "-"}</td>
                      <td>${Number(basePrice).toFixed(2)}</td>
                      <td>
                        <div>${Number(product.price ?? 0).toFixed(2)}</div>
                        {hasDiscount && (
                          <small className="text-success">
                            -{product.discountPercent}% (${Number(product.discountPrice ?? product.price).toFixed(2)})
                          </small>
                        )}
                      </td>
                      <td>
                        {hasDiscount ? (
                          <span className="badge bg-success">-{product.discountPercent}%</span>
                        ) : (
                          <span className="badge bg-secondary">No discount</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-2">
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            placeholder="%"
                            min="1"
                            max="99"
                            value={rowInput.percent ?? ""}
                            onChange={(e) => handleInputChange(product.id, "percent", e.target.value)}
                          />
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            placeholder="Price"
                            min="0"
                            step="0.01"
                            value={rowInput.price ?? ""}
                            onChange={(e) => handleInputChange(product.id, "price", e.target.value)}
                          />
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-2">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleApply(product)}
                            disabled={savingId === product.id}
                          >
                            {savingId === product.id ? "Saving..." : "Apply"}
                          </button>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            placeholder="New base price"
                            min="0"
                            step="0.01"
                            value={rowInput.basePrice ?? ""}
                            onChange={(e) => handleInputChange(product.id, "basePrice", e.target.value)}
                          />
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleSetPrice(product)}
                            disabled={savingId === product.id}
                          >
                            {savingId === product.id ? "Saving..." : "Set Price"}
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleClear(product)}
                            disabled={savingId === product.id || !hasDiscount}
                          >
                            Clear
                          </button>
                        </div>
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

export default DiscountManager;
