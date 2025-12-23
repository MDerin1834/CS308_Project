import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import api from "../api/client";

const isObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value || ""));

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadCategories = () => {
    setLoading(true);
    setError("");
    api
      .get("/api/categories", { validateStatus: () => true })
      .then((res) => {
        if (res.status === 200 && Array.isArray(res.data?.categories)) {
          setCategories(res.data.categories);
        } else {
          setError(res.data?.message || "Failed to load categories");
        }
      })
      .catch((err) => setError(err?.response?.data?.message || "Failed to load categories"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const name = newName.trim();
    if (!name) {
      setError("Category name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(
        "/api/categories",
        { name },
        { validateStatus: () => true }
      );
      if (res.status === 201) {
        setNewName("");
        setSuccess("Category created.");
        loadCategories();
      } else {
        setError(res.data?.message || "Failed to create category.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create category.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category) => {
    if (!isObjectId(category.id)) return;
    if (!window.confirm(`Delete category "${category.name}"?`)) return;

    setDeletingId(category.id);
    setError("");
    setSuccess("");
    try {
      const res = await api.delete(`/api/categories/${category.id}`, {
        validateStatus: () => true,
      });
      if (res.status === 200) {
        setSuccess("Category deleted.");
        loadCategories();
      } else {
        setError(res.data?.message || "Failed to delete category.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete category.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <PageHeader title="Categories" curPage="Category Manager" />

      <div className="shop-cart padding-tb">
        <div className="container">
          <div className="section-wrapper">
            {error && <p className="text-danger">{error}</p>}
            {success && <p className="text-success">{success}</p>}

            <form className="row g-3 mb-4" onSubmit={handleCreate}>
              <div className="col-md-8">
                <input
                  className="form-control"
                  placeholder="New category name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <button className="lab-btn bg-primary" type="submit" disabled={submitting}>
                  <span>{submitting ? "Adding..." : "Add Category"}</span>
                </button>
              </div>
            </form>

            <div className="cart-top">
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={2} className="text-center p-4">
                        Loading categories...
                      </td>
                    </tr>
                  )}
                  {!loading && categories.length === 0 && (
                    <tr>
                      <td colSpan={2} className="text-center p-4">
                        No categories found.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    categories.map((category) => {
                      const canDelete = isObjectId(category.id);
                      return (
                        <tr key={category.id || category.name}>
                          <td>
                            {category.name}
                            {!canDelete && (
                              <span className="ms-2 text-muted">(from products)</span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-outline-danger"
                              type="button"
                              onClick={() => handleDelete(category)}
                              disabled={!canDelete || deletingId === category.id}
                              title={
                                canDelete
                                  ? "Delete category"
                                  : "Seeded from products; create a managed category to delete."
                              }
                            >
                              {deletingId === category.id ? "Deleting..." : "Delete"}
                            </button>
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

export default CategoryManager;
