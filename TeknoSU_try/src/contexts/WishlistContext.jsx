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
    const normalized = stored.map((item) => ({
      productId: item.productId || item.id,
      product: item.product || {
        id: item.productId || item.id,
        name: item.name,
        img: item.img,
        imageURL: item.imageURL,
      },
    }));
    setWishlist(normalized);
  };

  useEffect(() => {
    loadWishlist();
  }, [user]);

  // ADD
  const addToWishlist = async (product) => {
    if (user) {
      const res = await api.post(
        "/api/wishlist",
        { productId: product.id },
        { validateStatus: () => true }
      );
      loadWishlist();
      return {
        ok: res.status >= 200 && res.status < 300,
        message:
          res.status >= 200 && res.status < 300
            ? "Added to wishlist"
            : res.data?.message || "Could not add to wishlist",
      };
    }

    // Guest (localStorage)
    const exists = wishlist.some((p) => (p.productId || p.id) === product.id);
    if (!exists) {
      const entry = {
        productId: product.id,
        product,
      };
      const updated = [...wishlist, entry];
      setWishlist(updated);
      localStorage.setItem("wishlist", JSON.stringify(updated));
    }
    return { ok: !exists, message: exists ? "Already in wishlist" : "Added to wishlist" };
  };

  // REMOVE
  const removeFromWishlist = async (productId) => {
    if (user) {
      await api.delete(`/api/wishlist/${productId}`, { validateStatus: () => true });
      loadWishlist();
      return;
    }

    const updated = wishlist.filter(
      (item) => (item.productId || item.id) !== productId
    );
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
