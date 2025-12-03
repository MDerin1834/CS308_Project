import { createContext, useState, useEffect, useContext } from "react";
import api from "../api/client";
import { AuthContext } from "./AuthProvider";

export const WishlistContext = createContext();

const WishlistProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [wishlist, setWishlist] = useState([]);

  // LOAD WISHLIST (User veya Guest)
  const loadWishlist = async () => {
    if (user) {
      try {
        const res = await api.get("/api/wishlist", { validateStatus: () => true });
        if (res.status === 200 && Array.isArray(res.data?.items)) {
          setWishlist(res.data.items);
          return;
        }
      } catch (err) {}
    }

    // Guest fallback
    const stored = JSON.parse(localStorage.getItem("wishlist")) || [];
    setWishlist(stored);
  };

  useEffect(() => {
    loadWishlist();
  }, [user]);

  // ADD
  const addToWishlist = async (product) => {
    if (user) {
      await api.post(
        "/api/wishlist",
        { productId: product.id },
        { validateStatus: () => true }
      );
      loadWishlist();
      return;
    }

    // Guest (localStorage)
    const exists = wishlist.some((p) => p.id === product.id);
    if (!exists) {
      const updated = [...wishlist, product];
      setWishlist(updated);
      localStorage.setItem("wishlist", JSON.stringify(updated));
    }
  };

  // REMOVE
  const removeFromWishlist = async (productId) => {
    if (user) {
      await api.delete(`/api/wishlist/${productId}`, { validateStatus: () => true });
      loadWishlist();
      return;
    }

    const updated = wishlist.filter((item) => item.id !== productId);
    setWishlist(updated);
    localStorage.setItem("wishlist", JSON.stringify(updated));
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        reloadWishlist: loadWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistProvider;
