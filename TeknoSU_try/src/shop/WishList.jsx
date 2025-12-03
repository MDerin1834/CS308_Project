import React, { useContext } from "react";
import PageHeader from "../components/PageHeader";
import { WishlistContext } from "../contexts/WishlistContext";
import { AuthContext } from "../contexts/AuthProvider";
import { useNavigate } from "react-router-dom";
import LoadingOverlay from "../components/LoadingOverlay";
import delImgUrl from "../assets/images/shop/del.png";

const WishlistPage = () => {
  const { wishlist, removeFromWishlist } = useContext(WishlistContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const moveToCart = (item) => {
    if (!user) {
      localStorage.setItem("redirectAfterLogin", "/wishlist");
      navigate("/login");
      return;
    }

    // API OR CART LOGIC HERE
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
                          <img src={item.img || item.imageURL} alt={item.name} />
                        </div>
                        <div className="p-content">{item.name}</div>
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
