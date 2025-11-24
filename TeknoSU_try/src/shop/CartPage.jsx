import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { useNavigate } from "react-router-dom";
import delImgUrl from "../assets/images/shop/del.png";
import api from "../api/client";

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loadCart = async () => {
    try {
      const res = await api.get("/api/cart", { validateStatus: () => true });
      if (res.status === 200) {
        setCartItems(res.data?.items || []);
        setSubtotal(res.data?.subtotal || 0);
      } else {
        setError(res.data?.message || "Cart could not be loaded");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Cart could not be loaded");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQuantity = async (productId, quantity) => {
    try {
      const res = await api.post(
        "/api/cart",
        { productId, quantity },
        { validateStatus: () => true }
      );
      if (res.status >= 200 && res.status < 300) {
        setCartItems(res.data.items || []);
        setSubtotal(res.data.subtotal || 0);
      } else {
        alert(res.data?.message || "Unable to update cart");
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Unable to update cart");
    }
  };

  const handleIncrease = (item) => updateQuantity(item.productId, item.quantity + 1);

  const handleDecrease = (item) => {
    if (item.quantity > 1) {
      updateQuantity(item.productId, item.quantity - 1);
    }
  };

  const handleRemoveItem = async (item) => {
    try {
      const res = await api.delete(`/api/cart/${item.productId}`, {
        validateStatus: () => true,
      });
      if (res.status >= 200 && res.status < 300) {
        setCartItems(res.data.items || []);
        setSubtotal(res.data.subtotal || 0);
      } else {
        alert(res.data?.message || "Unable to remove item");
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Unable to remove item");
    }
  };

  const orderTotal = subtotal;

  // ✅ Checkout button handler
  const handleCheckout = () => {
    navigate("/check-out", { state: { cartItems, orderTotal } });
  };

  return (
    <div>
      <PageHeader title={"Shop Cart"} curPage={"Cart Page"} />
      <div className="shop-cart padding-tb">
        <div className="container">
          <div className="section-wrapper">
            {error && <p style={{ color: "red" }}>{error}</p>}
            {/* cart top */}
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
                  {loading && (
                    <tr>
                      <td colSpan="5">Loading cart...</td>
                    </tr>
                  )}
                  {!loading && cartItems.map((item, indx) => (
                    <tr key={indx}>
                      <td className="product-item cat-product">
                        <div className="p-thumb">
                          <img src={item.img || item.imageURL || ""} alt={item.name} />
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
                      <td className="cat-toprice">${item.lineTotal}</td>
                      <td className="cat-edit">
                        <a href="#" onClick={(e) => { e.preventDefault(); handleRemoveItem(item); }}>
                          <img src={delImgUrl} alt="" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* cart bottom */}
            <div className="cart-bottom">
              <div className="cart-checkout-box">
                <form className="coupon" action="/">
                  <input type="text" name="coupon" placeholder="Coupon Code..." className="cart-page-input-text" />
                  <input type="submit" value="Apply Coupon" />
                </form>
                <div className="cart-checkout">
                  <input type="submit" value="Update Cart" />
                  <button
                    type="button"
                    className="lab-btn bg-primary"
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>

              {/* shipping & totals */}
              <div className="shiping-box">
                <div className="row">
                  <div className="col-md-6 col-12">
                    <div className="calculate-shiping">
                      <h3>Calculate Shipping</h3>
                      <div className="outline-select">
                        <select>
                          <option value="volvo">United Kingdom (UK)</option>
                          <option value="saab">Bangladesh</option>
                          <option value="saab">Pakisthan</option>
                          <option value="saab">India</option>
                          <option value="saab">Nepal</option>
                        </select>
                      </div>
                      <div className="outline-select shipping-select">
                        <select>
                          <option value="volvo">State/Country</option>
                          <option value="saab">Dhaka</option>
                          <option value="saab">Benkok</option>
                          <option value="saab">Kolkata</option>
                          <option value="saab">Kapasia</option>
                        </select>
                      </div>
                      <input type="text" name="coupon" placeholder="Postcode/ZIP" className="cart-page-input-text" />
                      <button type="submit">Update Total</button>
                    </div>
                  </div>
                  <div className="col-md-6 col-12">
                    <div className="cart-overview">
                      <h3>Cart Totals</h3>
                      <ul className="lab-ul">
                        <li>
                          <span className="pull-left">Cart Subtotal</span>
                          <p className="pull-right">$ {subtotal.toFixed(2)}</p>
                        </li>
                        <li>
                          <span className="pull-left">Shipping and Handling</span>
                          <p className="pull-right">Free Shipping</p>
                        </li>
                        <li>
                          <span className="pull-left">Order Total</span>
                          <p className="pull-right">$ {orderTotal.toFixed(2)}</p>
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
    </div>
  );
};

export default CartPage;
