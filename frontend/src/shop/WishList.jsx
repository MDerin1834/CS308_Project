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

  // Safe getter helper (product or plain item)
  const safeProduct = (item) => item.product || item;

  // Extract price logic
  const getPrice = (product) => {
    return (
      product.discountPrice ||
      product.discountedPrice ||
      product.basePrice ||
      product.price ||
      0
    );
  };

  const getOriginalPrice = (product) => product.price || product.basePrice || null;

  const getDiscountPercentage = (product) => {
    const p = product.price || product.basePrice;
    const dp = product.discountPrice || product.discountedPrice;
    if (!p || !dp || dp >= p) return null;
    return Math.round(((p - dp) / p) * 100);
  };

  const moveToCart = async (item) => {
    const product = safeProduct(item);
    const productId = product.id || item.productId;
    const price = getPrice(product);

    // Guest
    if (!user) {
      localStorage.setItem("redirectAfterLogin", "/wishlist");

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
        next[idx].quantity += 1;
      }

      localStorage.setItem("cart", JSON.stringify(next));
      alert("Added to cart");
      return;
    }

    // Logged-in
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

                  {wishlist.map((item, i) => {
                    const product = safeProduct(item);
                    const price = getPrice(product);
                    const original = getOriginalPrice(product);
                    const discountPerc = getDiscountPercentage(product);

                    return (
                      <tr key={i}>
                        <td className="product-item">
                          <div className="p-thumb">
                            <img
                              src={
                                product.img ||
                                product.imageURL ||
                                item.img ||
                                item.imageURL
                              }
                              alt={product.name}
                            />
                          </div>

                          <div className="p-content">
                            <h5>{product.name}</h5>

                            {/* Discount UI */}
                            {discountPerc ? (
                              <div className="wishlist-price">
                                <span className="discount-price">${price}</span>
                                <span className="old-price">${original}</span>
                                <span className="discount-badge">-{discountPerc}%</span>
                              </div>
                            ) : (
                              <div className="wishlist-price">
                                <span className="normal-price">${price}</span>
                              </div>
                            )}
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
                              removeFromWishlist(product.id || item.productId)
                            }
                          >
                            <img src={delImgUrl} alt="remove" style={{ width: "20px" }} />
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

export default WishlistPage;
