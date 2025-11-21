import React, { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthProvider";

const Signup = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { registerUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from?.pathname || "/";

  const handleSignup = async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const { elements } = form;
    const name = elements.name.value.trim();
    const email = elements.email.value.trim();
    const password = elements.password.value;
    const confirmPassword = elements.confirmPassword.value;

    setErrorMessage("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("❌ Şifreler uyuşmuyor!");
      return;
    }

    if (!name) {
      setErrorMessage("⚠️ Kullanıcı adı gerekli!");
      return;
    }

    const result = await registerUser(name, email, password);
    console.log("Backend result:", result);

    if (result.success || result.status === 201) {
      setSuccessMessage(result.message || "✅ Hesap başarıyla oluşturuldu!");
      setTimeout(() => navigate(from, { replace: true }), 2000);
    } else {
      setErrorMessage(
        result.message || "⚠️ Kayıt başarısız. Lütfen bilgileri kontrol edin."
      );
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#f9f9f9",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "40px",
          width: "400px",
          boxShadow: "0 0 15px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Register Now
        </h2>

        {/* 🔥 MESAJLAR */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: "#ffe5e5",
              color: "#a70000",
              border: "1px solid #a70000",
              borderRadius: "8px",
              padding: "10px 15px",
              marginBottom: "15px",
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              backgroundColor: "#ddffdd",
              color: "#006600",
              border: "1px solid #006600",
              borderRadius: "8px",
              padding: "10px 15px",
              marginBottom: "15px",
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSignup}>
          <input
            type="text"
            name="name"
            placeholder="User Name *"
            required
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="email"
            name="email"
            placeholder="Email *"
            required
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="password"
            name="password"
            placeholder="Password *"
            required
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password *"
            required
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />

          {/* 🔹 Eski temadaki buton stiline geri döndü */}
          <button className="lab-btn" type="submit" style={{ width: "100%" }}>
            <span>Get Started Now</span>
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "15px",
          }}
        >
          Already a member?{" "}
          <Link to="/login" style={{ color: "#007bff", fontWeight: "600" }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
