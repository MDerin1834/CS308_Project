/* eslint-disable react/prop-types */
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const desc =
  "Energistia an deliver atactica metrcs after avsionary Apropria trnsition enterpris an sources applications emerging psd template.";

const ProductDisplay = ({ item }) => {
  const navigate = useNavigate(); // ✅ Added for checkout redirect
  const { id, img, price, name, quantity, seller, stock } = item;

  const [prequantity, setQuantity] = useState(quantity);
  const [coupon, setCoupon] = useState("");
  const [size, setSize] = useState("Select Size");
  const [color, setColor] = useState("Select Color");

  const handleDecrease = () => {
    if (prequantity > 1) setQuantity(prequantity - 1);
  };

  const handleIncrease = () => {
    if (prequantity < stock) setQuantity(prequantity + 1);
    else alert(`⚠️ Maximum stock limit reached (${stock} units).`);
  };

  const handleSizeChange = (e) => setSize(e.target.value);
  const handleColorChange = (e) => setColor(e.target.value);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (stock <= 0) {
      alert(`❌ Sorry, ${name} is currently out of stock.`);
      return;
    }

    if (prequantity > stock) {
      alert(`⚠️ Only ${stock} units available. Please reduce quantity.`);
      return;
    }

    const product = { id, img, name, price, quantity: prequantity, size, color, coupon };

    const existingCart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingProductIndex = existingCart.findIndex((i) => i.id === id);

    if (existingProductIndex !== -1) {
      const newQuantity = existingCart[existingProductIndex].quantity + prequantity;
      if (newQuantity > stock) {
        alert(`⚠️ You can only have up to ${stock} units of ${name} in your cart.`);
        return;
      }
      existingCart[existingProductIndex].quantity = newQuantity;
    } else {
      existingCart.push(product);
    }

    localStorage.setItem("cart", JSON.stringify(existingCart));

    setQuantity(1);
    setSize("Select Size");
    setColor("Select Color");
    setCoupon("");
  };

  // ✅ Quick checkout button logic
  const handleCheckout = (e) => {
    e.preventDefault();

    handleSubmit(e);

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      localStorage.setItem("redirectAfterLogin", "/cart-page");
      navigate("/login");
    } else {
      navigate("/cart-page");
    }
  };

  return (
    <div>
      <div>
        <h4>{name}</h4>
        <p className="rating">
          <i className="icofont-star"></i>
          <i className="icofont-star"></i>
          <i className="icofont-star"></i>
          <i className="icofont-star"></i>
          <i className="icofont-star"></i>
          (3 review)
        </p>
        <h4>${price}</h4>
        <h6>{seller}</h6>

        {stock > 0 ? (
          <p style={{ color: "green", fontWeight: "500" }}>✅ In Stock: {stock} available</p>
        ) : (
          <p style={{ color: "red", fontWeight: "500" }}>❌ Out of Stock</p>
        )}
        <p>{desc}</p>
      </div>

      <div>
        <form onSubmit={handleSubmit}>
          <div className="select-product size">
            <select value={size} onChange={handleSizeChange}>
              <option>Select Size</option>
              <option>SM</option>
              <option>MD</option>
              <option>LG</option>
              <option>XL</option>
              <option>XXL</option>
            </select>
            <i className="icofont-rounded-down"></i>
          </div>

          <div className="select-product color">
            <select value={color} onChange={handleColorChange}>
              <option>Select Color</option>
              <option>Pink</option>
              <option>Ash</option>
              <option>Red</option>
              <option>White</option>
              <option>Blue</option>
            </select>
            <i className="icofont-rounded-down"></i>
          </div>

          <div className="cart-plus-minus">
            <div onClick={handleDecrease} className="dec qtybutton">-</div>
            <input
              className="cart-plus-minus-box"
              type="text"
              value={prequantity}
              onChange={(e) => setQuantity(Math.min(parseInt(e.target.value, 10) || 1, stock))}
            />
            <div className="inc qtybutton" onClick={handleIncrease}>+</div>
          </div>

          <div className="discount-code mb-2">
            <input type="text" placeholder="Enter Discount Code" onChange={(e) => setCoupon(e.target.value)} />
          </div>

          <button
            type="submit"
            className="lab-btn"
            disabled={stock <= 0}
            style={{ opacity: stock <= 0 ? 0.6 : 1, cursor: stock <= 0 ? "not-allowed" : "pointer" }}
          >
            <span>{stock > 0 ? "Add To Cart" : "Out of Stock"}</span>
          </button>

          <button className="lab-btn bg-primary" onClick={handleCheckout}>
            <span>Check Out</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductDisplay;
