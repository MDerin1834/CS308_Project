/* eslint-disable react/prop-types */

import { Link, useNavigate } from "react-router-dom";
import Rating from "../components/Rating";
import { useContext } from "react";
import { WishlistContext } from "../contexts/WishlistContext";

const ProductCards = ({ products, GridList }) => {
  
  const { addToWishlist } = useContext(WishlistContext);
  const navigate = useNavigate();

  // ❤️ Add to Wishlist tıklanınca çalışan fonksiyon
  const handleAddWishlist = async (product) => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
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
                <Link to="/cart-page">
                  <i className="icofont-cart-alt"></i>
                </Link>
              </div>
            </div>

            <div className="product-content">
              <h5>
                <Link to={`/shop/${product.id}`}>{product.name}</Link>
              </h5>
              <p className="productRating">
                <Rating value={product?.ratings} count={product?.ratingsCount} />
              </p>
              <h6>${product.price}</h6>
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
                <Link to="/cart-page">
                  <i className="icofont-cart-alt"></i>
                </Link>
              </div>
            </div>

            <div className="product-content">
              <Link to={`/shop/${product.id}`}>{product.name}</Link>
              <p className="productRating">
                <Rating value={product?.ratings} count={product?.ratingsCount} />
              </p>
              <h6>${product.price}</h6>
              <p>{product.seller}</p>
            </div>
          </div>

        </div>
      ))}
    </div>
  );
};

export default ProductCards;
