import React, { useEffect, useState } from "react";
import api from "../api/client";

const DeliveryList = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const res = await api.get("/api/orders/deliveries", {
          validateStatus: () => true,
        });

        if (res.status === 200) {
          setDeliveries(res.data?.deliveries || []);
        } else {
          setError(res.data?.message || "Deliveries could not be loaded");
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Deliveries could not be loaded");
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveries();
  }, []);

  const formatAddress = (address) => {
    if (!address) return "-";
    const parts = [
      address.fullName,
      address.addressLine1,
      address.addressLine2,
      address.city,
      address.country,
      address.postalCode,
    ].filter(Boolean);

    return parts.join(", ");
  };

  const renderCompletionBadge = (delivery) => {
    if (delivery.completed) {
      return <span className="badge bg-success">Delivered</span>;
    }
    const label = delivery.status
      ? delivery.status.replace("-", " ")
      : "In progress";
    return <span className="badge bg-warning text-dark">{label}</span>;
  };

  return (
    <div className="container py-5">
      <div className="section-wrapper">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <p className="mb-1 text-uppercase text-muted small">Backlog 37</p>
            <h2 className="mb-0">Delivery List</h2>
          </div>
        </div>

        {loading && <p>Loading deliveries...</p>}
        {!loading && error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && deliveries.length === 0 && (
          <div className="alert alert-info">No deliveries found.</div>
        )}

        {!loading && !error && deliveries.length > 0 && (
          <div className="table-responsive shadow-sm rounded bg-white">
            <table className="table align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Address</th>
                  <th scope="col">Completion</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((delivery) => (
                  <tr key={delivery.id}>
                    <td className="text-nowrap">{delivery.id}</td>
                    <td>{formatAddress(delivery.shippingAddress)}</td>
                    <td>{renderCompletionBadge(delivery)}</td>
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

export default DeliveryList;
