/* eslint-disable react/prop-types */

import { Link, useNavigate } from "react-router-dom";
import Rating from "../components/Rating";
import { useContext } from "react";
import { WishlistContext } from "../contexts/WishlistContext";
import { AuthContext } from "../contexts/AuthProvider";

const ProductCards = ({ products, GridList }) => {

  const { addToWishlist } = useContext(WishlistContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isSalesManager = user?.role === "sales_manager";

  // ❤️ Add to Wishlist tıklanınca çalışan fonksiyon
  const handleAddWishlist = async (product) => {
    const storedUser = user || JSON.parse(localStorage.getItem("user"));

    if (!storedUser) {
      // Login değilse login’e yönlendir
      localStorage.setItem("redirectAfterLogin", "/shop");
      navigate("/login");
      return;
    }

    const result = await addToWishlist(product);
    if (result?.message) {
      alert(result.message);
    }
  };

  return (
    <div
      className={`shop-product-wrap row justify-content-center ${
        GridList ? "grid" : "list"
      }`}
    >
      {products.map((product, i) => (
        <div className="col-lg-4 col-md-6 col-12" key={i}>
          
          {/* ⭐ GRID VIEW */}
          <div className="product-item">
            <div className="product-thumb">
              <div className="pro-thumb">
                <img src={product.img || product.imageURL} alt={product.name} />
              </div>
              {(() => {
                const basePrice = Number(product.originalPrice ?? product.basePrice ?? product.price ?? 0);
                const currentPrice = Number(product.discountPrice ?? product.price ?? 0);
                const hasDiscount = basePrice > 0 && currentPrice > 0 && currentPrice < basePrice;
                const percent = hasDiscount
                  ? product.discountPercent ?? Math.round(((basePrice - currentPrice) / basePrice) * 100)
                  : null;
                return hasDiscount ? (
                  <span
                    className="badge bg-danger position-absolute"
                    style={{ top: "10px", left: "10px" }}
                  >
                    -{percent}%
                  </span>
                ) : null;
              })()}

              {/* ⭐ ACTION BUTTONS */}
              <div className="product-action-link">

                {/* GÖRÜNTÜLE */}
                <Link to={`/shop/${product.id}`}>
                  <i className="icofont-eye"></i>
                </Link>

                {/* ❤️ ADD TO WISHLIST */}
                <a href="#" onClick={(e) => { e.preventDefault(); handleAddWishlist(product); }}>
                  <i className="icofont-heart"></i>
                </a>

                {/* CART SAYFASINA GİT */}
                {!isSalesManager && (
                  <Link to="/cart-page">
                    <i className="icofont-cart-alt"></i>
                  </Link>
                )}
              </div>
            </div>

            <div className="product-content">
              <h5>
                <Link to={`/shop/${product.id}`}>{product.name}</Link>
              </h5>
              <p className="productRating">
                <Rating value={product?.ratings} count={product?.ratingsCount} />
              </p>
              {(() => {
                const basePrice = Number(product.originalPrice ?? product.basePrice ?? product.price ?? 0);
                const currentPrice = Number(product.discountPrice ?? product.price ?? 0);
                const hasDiscount = basePrice > 0 && currentPrice > 0 && currentPrice < basePrice;
                const percent = hasDiscount
                  ? product.discountPercent ?? Math.round(((basePrice - currentPrice) / basePrice) * 100)
                  : null;
                return (
                  <div className="d-flex align-items-center gap-2">
                    <h6 className="mb-0">${currentPrice.toFixed(2)}</h6>
                    {hasDiscount && (
                      <>
                        <span className="text-muted text-decoration-line-through">
                          ${basePrice.toFixed(2)}
                        </span>
                        {percent ? <span className="badge bg-danger">-{percent}%</span> : null}
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ⭐ LIST VIEW */}
          <div className="product-list-item">
            <div className="product-thumb">
              <div className="pro-thumb">
                <img src={product.img || product.imageURL} alt={product.name} />
              </div>

              <div className="product-action-link">

                {/* GÖRÜNTÜLE */}
                <Link to={`/shop/${product.id}`}>
                  <i className="icofont-eye"></i>
                </Link>

                {/* ❤️ ADD TO WISHLIST (List görünümü) */}
                <a href="#" onClick={(e) => { e.preventDefault(); handleAddWishlist(product); }}>
                  <i className="icofont-heart"></i>
                </a>

                {/* CART */}
                {!isSalesManager && (
                  <Link to="/cart-page">
                    <i className="icofont-cart-alt"></i>
                  </Link>
                )}
              </div>
            </div>

            <div className="product-content">
              <Link to={`/shop/${product.id}`}>{product.name}</Link>
              <p className="productRating">
                <Rating value={product?.ratings} count={product?.ratingsCount} />
              </p>
              {(() => {
                const basePrice = Number(product.originalPrice ?? product.basePrice ?? product.price ?? 0);
                const currentPrice = Number(product.discountPrice ?? product.price ?? 0);
                const hasDiscount = basePrice > 0 && currentPrice > 0 && currentPrice < basePrice;
                const percent = hasDiscount
                  ? product.discountPercent ?? Math.round(((basePrice - currentPrice) / basePrice) * 100)
                  : null;
                return (
                  <div className="d-flex align-items-center gap-2">
                    <h6 className="mb-0">${currentPrice.toFixed(2)}</h6>
                    {hasDiscount && (
                      <>
                        <span className="text-muted text-decoration-line-through">
                          ${basePrice.toFixed(2)}
                        </span>
                        {percent ? <span className="badge bg-danger">-{percent}%</span> : null}
                      </>
                    )}
                  </div>
                );
              })()}
              <p>{product.seller}</p>
            </div>
          </div>

        </div>
      ))}
    </div>
  );
};

export default ProductCards;
