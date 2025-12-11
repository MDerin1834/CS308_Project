import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5050"}/api/users`;

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const mergeGuestCart = async (token) => {
    const guestCart = JSON.parse(localStorage.getItem("cart")) || [];
    if (!guestCart.length || !token) return;
    try {
      const cartItems = guestCart.map((item) => ({
        productId: item.id || item.productId,
        quantity: item.quantity || 1,
      }));
      await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:5050"}/api/cart/merge`,
        { items: cartItems },
        {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: () => true,
        }
      );
      localStorage.removeItem("cart");
    } catch {
      // Sessiz geç; login akışını bloklamasın
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // ✅ REGISTER
  const registerUser = async (username, email, password, extra = {}) => {
    try {
      const response = await axios.post(
        `${API_URL}/register`,
        {
          username,
          email,
          password,
          fullName: extra.fullName,
          taxId: extra.taxId,
          homeAddress: extra.homeAddress,
        },
        { validateStatus: () => true }
      );

      if (response.status === 201 || response.status === 200) {
        const { token, user } = response.data || {};
        if (token && user) {
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));
          setUser(user);
          await mergeGuestCart(token);
        }
        return {
          success: true,
          status: response.status,
          message: response.data?.message || "User registered successfully",
          data: response.data,
        };
      }

      return {
        success: false,
        status: response.status,
        message:
          response.data?.message || "Login failed! Please check information you entered.",
      };
    } catch (error) {
      return {
        success: false,
        status: 500,
        message:
          error.response?.data?.message ||
          "Failed to connect to the server, please try again!",
      };
    }
  };

  // Placeholder for future OAuth flow to prevent runtime errors on click
  const signUpWithGmail = async () => {
    return Promise.reject(new Error("Google signup is not configured yet."));
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
        await mergeGuestCart(response.data.token);
        return {
          success: true,
          status: response.status,
          message: response.data.message || "Login successful",
          user: response.data.user,
          token: response.data.token,
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

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const response = await axios.get(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });
    if (response.status === 200 && response.data?.user) {
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setUser(response.data.user);
      return response.data.user;
    }
    return null;
  };

  const updateProfile = async (payload) => {
    const token = localStorage.getItem("token");
    if (!token) {
      return { success: false, status: 401, message: "Not authenticated" };
    }
    const response = await axios.put(`${API_URL}/me`, payload, {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });
    if (response.status === 200 && response.data?.user) {
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setUser(response.data.user);
      return { success: true, status: 200, message: response.data.message, user: response.data.user };
    }
    return {
      success: false,
      status: response.status,
      message: response.data?.message || "Failed to update profile",
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        registerUser,
        login,
        logOut,
        signUpWithGmail,
        fetchProfile,
        updateProfile,
        setUser,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
