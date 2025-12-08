import React, { useContext } from "react";
import PageHeader from "../components/PageHeader";
import { WishlistContext } from "../contexts/WishlistContext";
import { AuthContext } from "../contexts/AuthProvider";
import { useNavigate } from "react-router-dom";
import LoadingOverlay from "../components/LoadingOverlay";
import delImgUrl from "../assets/images/shop/del.png";
import api from "../api/client";

const WishlistPage = () => {
  const { wishlist, removeFromWishlist } = useContext(WishlistContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const moveToCart = async (item) => {
    const product = item.product || item;
    const productId = product.id || item.productId;
    const price = product.price || product.discountPrice || product.discountedPrice || product.basePrice || 0;

    if (!user) {
      localStorage.setItem("redirectAfterLogin", "/wishlist");
      // Guest sepeti
      const existing = JSON.parse(localStorage.getItem("cart")) || [];
      const idx = existing.findIndex((it) => it.id === productId);
      const next = [...existing];
      if (idx === -1) {
        next.push({
          id: productId,
          name: product.name,
          price,
          quantity: 1,
          img: product.img || product.imageURL,
        });
      } else {
        next[idx] = { ...next[idx], quantity: (next[idx].quantity || 0) + 1 };
      }
      localStorage.setItem("cart", JSON.stringify(next));
      alert("Added to cart");
      return;
    }

    try {
      const res = await api.post(
        "/api/cart",
        { productId, quantity: 1 },
        { validateStatus: () => true }
      );
      if (res.status >= 200 && res.status < 300) {
        alert("Added to cart");
      } else {
        alert(res.data?.message || "Could not add to cart");
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Could not add to cart");
    }
  };

  return (
    <div>
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
                          <img
                            src={
                              item.product?.img ||
                              item.product?.imageURL ||
                              item.img ||
                              item.imageURL
                            }
                            alt={item.product?.name || item.name}
                          />
                        </div>
                        <div className="p-content">
                          {item.product?.name || item.name}
                        </div>
                      </td>

                      <td>
                        <button
                          className="lab-btn"
                          onClick={() => moveToCart(item)}
                        >
                          Add to Cart
                        </button>

                        <button
                          className="btn btn-danger ms-2"
                          onClick={() =>
                            removeFromWishlist(item.productId || item.id)
                          }
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
