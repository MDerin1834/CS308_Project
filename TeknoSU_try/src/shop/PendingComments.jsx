import React, { useEffect, useState } from "react";
import api from "../api/client";

const PendingComments = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const loadComments = () => {
    setLoading(true);
    setError("");
    api
      .get("/api/comments/pending", { validateStatus: () => true })
      .then((res) => {
        if (res.status === 200 && Array.isArray(res.data?.comments)) {
          setComments(res.data.comments);
        } else {
          setError(res.data?.message || "Failed to load comments");
        }
      })
      .catch((err) => setError(err?.response?.data?.message || "Failed to load comments"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadComments();
  }, []);

  const updateStatus = async (id, action) => {
    setUpdatingId(id);
    setError("");
    try {
      const res = await api.patch(`/api/comments/${id}/${action}`, {}, { validateStatus: () => true });
      if (res.status === 200) {
        setComments((prev) => prev.filter((c) => c.id !== id));
      } else {
        setError(res.data?.message || "Failed to update comment");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update comment");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4">Pending Comments</h2>
      {loading && <p>Loading comments...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && comments.length === 0 && !error && <p>No pending comments.</p>}

      {!loading && comments.length > 0 && (
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead>
              <tr>
                <th>Comment ID</th>
                <th>Product ID</th>
                <th>User</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.productId}</td>
                  <td>
                    {c.userName || "-"}<br />
                    <small>{c.userEmail || c.userId || ""}</small>
                  </td>
                  <td>{c.rating ? `${c.rating} ⭐` : "-"}</td>
                  <td>{c.comment}</td>
                  <td>{c.createdAt ? new Date(c.createdAt).toLocaleString() : "-"}</td>
                  <td className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => updateStatus(c.id, "approve")}
                      disabled={updatingId === c.id}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => updateStatus(c.id, "reject")}
                      disabled={updatingId === c.id}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PendingComments;
