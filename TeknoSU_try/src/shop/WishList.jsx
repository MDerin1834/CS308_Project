import React, { useEffect, useState, useContext } from "react";
import PageHeader from "../components/PageHeader";
import { AuthContext } from "../contexts/AuthProvider";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import LoadingOverlay from "../components/LoadingOverlay";
import delImgUrl from "../assets/images/shop/del.png";

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const loadWishlist = async () => {
    setLoading(true);

    try {
      if (user) {
        // Load wishlist from server
        const res = await api.get("/api/wishlist", { validateStatus: () => true });

        if (res.status === 200 && Array.isArray(res.data?.items)) {
          setWishlist(res.data.items);
          setLoading(false);
          return;
        }
      }

      // Fallback: guest wishlist stored locally
      const stored = JSON.parse(localStorage.getItem("wishlist")) || [];
      setWishlist(stored);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, [user]);

  const removeFromWishlist = async (productId) => {
    setLoading(true);

    if (user) {
      try {
        await api.delete(`/api/wishlist/${productId}`, { validateStatus: () => true });
        loadWishlist();
      } finally {
        setLoading(false);
      }
      return;
    }

    // Guest localStorage
    const updated = wishlist.filter((p) => p.id !== productId);
    setWishlist(updated);
    localStorage.setItem("wishlist", JSON.stringify(updated));
    setLoading(false);
  };

  const moveToCart = async (item) => {
    if (!user) {
      localStorage.setItem("redirectAfterLogin", "/wishlist");
      navigate("/login");
      return;
    }

    setLoading(true);

    await api.post(
      "/api/cart",
      { productId: item.id, quantity: 1 },
      { validateStatus: () => true }
    );

    removeFromWishlist(item.id);
    setLoading(false);
  };

  return (
    <div>
      {loading && <LoadingOverlay />}
      <PageHeader title="My Wishlist" curPage="Wishlist" />

      <div className="shop-cart padding-tb">
        <div className="container">
          <div className="section-wrapper">
            <div className="cart-top">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {wishlist.length === 0 && (
                    <tr>
                      <td colSpan={2} className="text-center p-4">
                        Your wishlist is empty.
                      </td>
                    </tr>
                  )}

                  {wishlist.map((item, i) => (
                    <tr key={i}>
                      <td className="product-item">
                        <div className="p-thumb">
                          <img src={item.img} alt={item.name} />
                        </div>
                        <div className="p-content">{item.name}</div>
                      </td>

                      <td>
                        <button className="lab-btn" onClick={() => moveToCart(item)}>
                          Add to Cart
                        </button>

                        <button
                          className="btn btn-danger ms-2"
                          onClick={() => removeFromWishlist(item.id)}
                        >
                          <img src={delImgUrl} alt="remove" style={{ width: "20px" }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
