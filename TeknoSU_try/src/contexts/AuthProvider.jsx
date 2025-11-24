import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5050"}/api/users`;

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // ✅ REGISTER
  const registerUser = async (username, email, password) => {
    try {
      const response = await axios.post(
        `${API_URL}/register`,
        { username, email, password },
        { validateStatus: () => true }
      );

      if (response.status === 201 || response.status === 200) {
        return {
          success: true,
          status: response.status,
          message: response.data?.message || "User registered successfully",
        };
      }

      return {
        success: false,
        status: response.status,
        message:
          response.data?.message || "Kayıt başarısız. Lütfen bilgileri kontrol edin.",
      };
    } catch (error) {
      return {
        success: false,
        status: 500,
        message:
          error.response?.data?.message ||
          "Sunucuyla iletişim kurulamadı. Lütfen tekrar deneyin.",
      };
    }
  };

  // ✅ LOGIN
  const login = async (email, password) => {
    try {
      const response = await axios.post(
        `${API_URL}/login`,
        { email, password },
        { validateStatus: () => true }
      );

      if ((response.status === 200 || response.status === 201) && response.data?.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        setUser(response.data.user);
        return {
          success: true,
          status: response.status,
          message: response.data.message || "Login successful",
        };
      }

      return {
        success: false,
        status: response.status,
        message: response.data?.message || "Geçersiz e-posta veya şifre.",
      };
    } catch (error) {
      return {
        success: false,
        status: 500,
        message:
          error.response?.data?.message ||
          "Sunucuyla iletişim kurulamadı. Lütfen tekrar deneyin.",
      };
    }
  };

  const logOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, registerUser, login, logOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
