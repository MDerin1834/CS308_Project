import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { AuthContext } from "../contexts/AuthProvider";

const initialForm = {
  id: "",
  name: "",
  price: "",
  category: "",
  seller: "",
  stock: "",
  description: "",
  imageURL: "",
  model: "",
  serialNumber: "",
  tag: "",
  warranty: "",
  distributor: "",
  shipping: "",
  specs: "",
};

const ProductCreate = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      if (!form.id || !form.name || !form.price || !form.category || !form.seller) {
        setError("Please fill required fields (ID, Name, Price, Category, Seller).");
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== "") formData.append(key, value);
      });
      if (imageFile) {
        formData.append("image", imageFile);
      }

      // If specs is typed as JSON, ensure it stays as string for backend parse
      if (form.specs) {
        try {
          JSON.parse(form.specs);
        } catch {
          setError("Specs must be valid JSON (e.g., {\"color\":\"red\"}).");
          setSubmitting(false);
          return;
        }
      }

      const res = await api.post("/api/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        validateStatus: () => true,
      });

      if (res.status === 201) {
        setSuccess("Product created successfully.");
        setForm(initialForm);
        setImageFile(null);
        navigate(`/shop/${form.id}`);
      } else {
        setError(res.data?.message || "Failed to create product.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create product.");
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role !== "product_manager") {
    return (
      <div className="container padding-tb">
        <h2>Create Product</h2>
        <p style={{ color: "red" }}>Only product managers can create products.</p>
      </div>
    );
  }

  return (
    <div className="container padding-tb">
      <h2>Create Product</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
      <form onSubmit={handleSubmit} className="row g-3">
        <div className="col-md-4">
          <label className="form-label">Product ID *</label>
          <input
            className="form-control"
            name="id"
            value={form.id}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Name *</label>
          <input
            className="form-control"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Seller *</label>
          <input
            className="form-control"
            name="seller"
            value={form.seller}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-3">
          <label className="form-label">Price *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="form-control"
            name="price"
            value={form.price}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Stock</label>
          <input
            type="number"
            min="0"
            className="form-control"
            name="stock"
            value={form.stock}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Shipping Cost</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="form-control"
            name="shipping"
            value={form.shipping}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Category *</label>
          <input
            className="form-control"
            name="category"
            value={form.category}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-12">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <div className="col-md-4">
          <label className="form-label">Image URL (optional if uploading)</label>
          <input
            className="form-control"
            name="imageURL"
            value={form.imageURL}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Upload Image</label>
          <input className="form-control" type="file" accept="image/*" onChange={handleFileChange} />
        </div>
        <div className="col-md-4">
          <label className="form-label">Tag</label>
          <input
            className="form-control"
            name="tag"
            value={form.tag}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-4">
          <label className="form-label">Model</label>
          <input
            className="form-control"
            name="model"
            value={form.model}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Serial Number</label>
          <input
            className="form-control"
            name="serialNumber"
            value={form.serialNumber}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Warranty</label>
          <input
            className="form-control"
            name="warranty"
            value={form.warranty}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Distributor</label>
          <input
            className="form-control"
            name="distributor"
            value={form.distributor}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Specs (JSON)</label>
          <textarea
            className="form-control"
            name="specs"
            value={form.specs}
            onChange={handleChange}
            rows="2"
            placeholder='e.g. {"color":"red","weight":"1kg"}'
          />
        </div>

        <div className="col-12">
          <button className="lab-btn bg-primary" type="submit" disabled={submitting}>
            <span>{submitting ? "Submitting..." : "Create Product"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductCreate;
