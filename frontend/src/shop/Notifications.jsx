import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import api from "../api/client";
import { AuthContext } from "../contexts/AuthProvider";

const Notifications = () => {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
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
    load();
  }, [user]);

  const clearNotifications = () => {
    setItems([]);
  };

  return (
    <div>
      <PageHeader title="Notifications" curPage="Notifications" />
      <div className="container py-5">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h3 className="mb-0">Discount Notifications</h3>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary" onClick={load} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <button className="btn btn-outline-danger" onClick={clearNotifications} disabled={items.length === 0}>
              Clear
            </button>
          </div>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        {!user && (
          <div className="alert alert-warning">
            Please <Link to="/login">sign in</Link> to view your notifications.
          </div>
        )}
        {loading && <p>Loading notifications...</p>}
        {!loading && user && items.length === 0 && !error && (
          <p className="text-muted">No discount notifications right now.</p>
        )}
        {!loading && items.length > 0 && (
          <div className="row g-3">
            {items.map((item) => (
              <div className="col-md-6 col-lg-4" key={item.productId}>
                <div className="card h-100">
                  {item.imageURL ? (
                    <img
                      src={item.imageURL}
                      alt={item.name}
                      className="card-img-top"
                      style={{ height: "180px", objectFit: "cover" }}
                    />
                  ) : null}
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{item.name}</h5>
                    <p className="card-text mb-1">
                      Now ${Number(item.currentPrice ?? 0).toFixed(2)} (was ${Number(item.basePrice ?? 0).toFixed(2)})
                    </p>
                    <p className="card-text text-success mb-2">
                      -{Number(item.discountPercent ?? 0)}%
                    </p>
                    <div className="mt-auto d-flex justify-content-between align-items-center">
                      <Link className="btn btn-primary btn-sm" to={`/shop/${item.productId}`}>
                        View Product
                      </Link>
                      <span className="badge bg-success">Discounted</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
