import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { useNavigate } from "react-router-dom";
import delImgUrl from "../assets/images/shop/del.png";
import LoadingOverlay from "../components/LoadingOverlay";
import CheckoutPage from "./CheckoutPage";

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const storedCartItems = JSON.parse(localStorage.getItem("cart")) || [];
    setCartItems(storedCartItems);
    setLoading(false);
  }, []);

  const calculateTotalPrice = (item) => item.price * item.quantity;

  const handleIncrease = (item) => {
    setLoading(true);
    const updatedCart = cartItems.map((cartItem) =>
      cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
    );
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setLoading(false);
  };

  const handleDecrease = (item) => {
    if (item.quantity > 1) {
      setLoading(true);
      const updatedCart = cartItems.map((cartItem) =>
        cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity - 1 } : cartItem
      );
      setCartItems(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      setLoading(false);
    }
  };

  const handleRemoveItem = (item) => {
    setLoading(true);
    const updatedCart = cartItems.filter((cartItem) => cartItem.id !== item.id);
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setLoading(false);
  };

  const cartSubtotal = cartItems.reduce(
    (total, item) => total + calculateTotalPrice(item),
    0
  );
  const orderTotal = cartSubtotal;

  const handleCheckout = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      localStorage.setItem("redirectAfterLogin", "/cart-page");
      navigate("/login");
    } else {
      setShowCheckout(true);
    }
  };

  return (
    <div>
      {/* ⭐ Full-page Loading Overlay */}
      {loading && <LoadingOverlay />}

      <PageHeader title={"Shop Cart"} curPage={"Cart Page"} />

      <div className="shop-cart padding-tb">
        <div className="container">
          <div className="section-wrapper">
            <div className="cart-top">
              <table>
                <thead>
                  <tr>
                    <th className="cat-product">Product</th>
                    <th className="cat-price">Price</th>
                    <th className="cat-quantity">Quantity</th>
                    <th className="cat-toprice">Total</th>
                    <th className="cat-edit">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item, indx) => (
                    <tr key={indx}>
                      <td className="product-item cat-product">
                        <div className="p-thumb">
                          <img src={item.img} alt={item.name} />
                        </div>
                        <div className="p-content">{item.name}</div>
                      </td>
                      <td className="cat-price">${item.price}</td>
                      <td className="cat-quantity">
                        <div className="cart-plus-minus">
                          <div className="dec qtybutton" onClick={() => handleDecrease(item)}>-</div>
                          <input
                            className="cart-plus-minus-box"
                            type="text"
                            value={item.quantity}
                            readOnly
                          />
                          <div className="inc qtybutton" onClick={() => handleIncrease(item)}>+</div>
                        </div>
                      </td>
                      <td className="cat-toprice">${calculateTotalPrice(item)}</td>
                      <td className="cat-edit">
                        <a href="#" onClick={() => handleRemoveItem(item)}>
                          <img src={delImgUrl} alt="Delete" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="cart-bottom">
              <div className="cart-checkout-box">
                <form className="coupon" action="/">
                  <input type="text" placeholder="Coupon Code..." className="cart-page-input-text" />
                  <input type="submit" value="Apply Coupon" />
                </form>
                <div className="cart-checkout">
                  <input type="submit" value="Update Cart" />
                  <button className="lab-btn bg-primary" onClick={handleCheckout}>
                    Proceed to Checkout
                  </button>
                </div>
              </div>

              <div className="shiping-box">
                <div className="row">
                  <div className="col-md-6 col-12">
                    <div className="calculate-shiping">
                      <h3>Calculate Shipping</h3>
                      {/* Shipping form here */}
                    </div>
                  </div>
                  <div className="col-md-6 col-12">
                    <div className="cart-overview">
                      <h3>Cart Totals</h3>
                      <ul className="lab-ul">
                        <li>
                          <span className="pull-left">Cart Subtotal</span>
                          <p className="pull-right">${cartSubtotal}</p>
                        </li>
                        <li>
                          <span className="pull-left">Shipping and Handling</span>
                          <p className="pull-right">Free Shipping</p>
                        </li>
                        <li>
                          <span className="pull-left">Order Total</span>
                          <p className="pull-right">${orderTotal.toFixed(2)}</p>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ⭐ Checkout modal */}
      <CheckoutPage
        show={showCheckout}
        onClose={() => setShowCheckout(false)}
        cartItems={cartItems}
        orderTotal={orderTotal}
      />
    </div>
  );
};

export default CartPage;
