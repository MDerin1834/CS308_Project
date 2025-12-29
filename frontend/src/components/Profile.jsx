import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthProvider";
import PageHeader from "../components/PageHeader";

const Profile = () => {
  const { user, fetchProfile, updateProfile } = useContext(AuthContext);
  const [form, setForm] = useState({
    fullName: "",
    taxId: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    country: "",
    postalCode: "",
    phone: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const profile = await fetchProfile();
        const home = profile?.homeAddress || {};
        setForm({
        fullName: profile?.fullName || profile?.username || "",
          taxId: profile?.taxId || "",
          addressLine1: home.addressLine1 || "",
          addressLine2: home.addressLine2 || "",
          city: home.city || "",
          country: home.country || "",
          postalCode: home.postalCode || "",
          phone: home.phone || "",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const result = await updateProfile({
      fullName: form.fullName,
      taxId: form.taxId,
      homeAddress: {
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        country: form.country,
        postalCode: form.postalCode,
        phone: form.phone,
      },
    });
    setLoading(false);
    if (result.success) {
      setMessage(result.message || "Profile updated");
    } else {
      setError(result.message || "Update failed");
    }
  };

  if (!user) {
    return <div className="container py-5">You need to login to view this page.</div>;
  }
  if (user.role && user.role !== "customer") {
    return <div className="container py-5">Profile is only available for customers.</div>;
  }

  return (
    <div>
      <PageHeader title="My Profile" curPage="Profile" />
      <div className="container padding-tb">
        <form className="account-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={user.email} disabled />
          </div>
          <div className="form-group">
            <label>Tax ID</label>
            <input
              type="text"
              name="taxId"
              value={form.taxId}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Address Line 1</label>
            <input
              type="text"
              name="addressLine1"
              value={form.addressLine1}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Address Line 2</label>
            <input
              type="text"
              name="addressLine2"
              value={form.addressLine2}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Country</label>
            <input
              type="text"
              name="country"
              value={form.country}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Postal Code</label>
            <input
              type="text"
              name="postalCode"
              value={form.postalCode}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone (optional)</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          {error && <div className="text-danger mb-2">{error}</div>}
          {message && <div className="text-success mb-2">{message}</div>}

          <div className="form-group">
            <button className="lab-btn" type="submit" disabled={loading}>
              <span>{loading ? "Saving..." : "Save Profile"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
