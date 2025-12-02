import React, { useEffect, useState, useContext } from "react";
import PageHeader from "../components/PageHeader";
import { useNavigate } from "react-router-dom";
import delImgUrl from "../assets/images/shop/del.png";
import LoadingOverlay from "../components/LoadingOverlay";
import CheckoutPage from "./CheckoutPage";
import api from "../api/client";
import { AuthContext } from "../contexts/AuthProvider";

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const loadCart = async () => {
    setLoading(true);
    try {
      if (user) {
        const res = await api.get("/api/cart", { validateStatus: () => true });
        if (res.status === 200 && Array.isArray(res.data?.items)) {
          const normalized = res.data.items.map((it) => ({
            id: it.productId,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            img: it.img,
          }));
          setCartItems(normalized);
          setLoading(false);
          return;
        }
      }
      // fallback to local storage for guests or failed fetch
      const storedCartItems = JSON.parse(localStorage.getItem("cart")) || [];
      setCartItems(storedCartItems);
    } catch (err) {
      const storedCartItems = JSON.parse(localStorage.getItem("cart")) || [];
      setCartItems(storedCartItems);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, [user]);

  const calculateTotalPrice = (item) => item.price * item.quantity;

  const updateQuantity = async (item, nextQty) => {
    if (nextQty < 1) return;
    setLoading(true);
    try {
      if (user) {
        const res = await api.post(
          "/api/cart",
          { productId: item.id, quantity: nextQty },
          { validateStatus: () => true }
        );
        if (res.status === 200 && Array.isArray(res.data?.items)) {
          const normalized = res.data.items.map((it) => ({
            id: it.productId,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            img: it.img,
          }));
          setCartItems(normalized);
        }
      } else {
        const updatedCart = cartItems.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: nextQty } : cartItem
        );
        setCartItems(updatedCart);
        localStorage.setItem("cart", JSON.stringify(updatedCart));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleIncrease = (item) => updateQuantity(item, item.quantity + 1);

  const handleDecrease = (item) =>
    item.quantity > 1 ? updateQuantity(item, item.quantity - 1) : null;

  const handleRemoveItem = (item) => {
    setLoading(true);
    const removeLocal = () => {
      const updatedCart = cartItems.filter((cartItem) => cartItem.id !== item.id);
      setCartItems(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
    };

    if (user) {
      api
        .delete(`/api/cart/${item.id}`, { validateStatus: () => true })
        .then(() => loadCart())
        .catch(() => removeLocal())
        .finally(() => setLoading(false));
    } else {
      removeLocal();
      setLoading(false);
    }
  };

  const cartSubtotal = cartItems.reduce(
    (total, item) => total + calculateTotalPrice(item),
    0
  );
  const orderTotal = cartSubtotal;

 const handleCheckout = () => {
  if (!user) {
    localStorage.setItem("redirectAfterLogin", "/cart-page");
    navigate("/login");
    return;
  }

  setShowCheckout(true);
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
