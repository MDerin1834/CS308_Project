
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { AuthContext } from "../contexts/AuthProvider";
import Rating from "../components/Rating";

const ProductDisplay = ({ item }) => {
  const navigate = useNavigate(); // ✅ Added for checkout redirect
  const { user } = useContext(AuthContext);
  const { id, img, price, name, quantity, seller, stock, description, model, serialNumber, warranty, distributor } = item;

  const [prequantity, setQuantity] = useState(quantity);
  const [color, setColor] = useState("");

  const quantityError = "productId and positive quantity are required";

  const saveGuestCart = () => {
    if (prequantity < 1) {
      alert(quantityError);
      return;
    }
    const existing = JSON.parse(localStorage.getItem("cart")) || [];
    const idx = existing.findIndex((it) => it.id === id || it.productId === id);
    const next = [...existing];
    if (idx === -1) {
      next.push({
        id,
        name,
        price,
        quantity: prequantity,
        img: img || item.imageURL,
      });
    } else {
      next[idx] = {
        ...next[idx],
        quantity: (next[idx].quantity || 0) + prequantity,
        price,
        img: img || item.imageURL,
      };
    }
    localStorage.setItem("cart", JSON.stringify(next));
  };

  const handleDecrease = () => {
    if (prequantity > 1) setQuantity(prequantity - 1);
  };

  const handleIncrease = () => {
    if (prequantity < stock) setQuantity(prequantity + 1);
    else alert(`⚠️ Maximum stock limit reached (${stock} units).`);
  };

  const handleColorChange = (e) => setColor(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const availableStock = typeof stock === "number" ? stock : Infinity;
    if (availableStock <= 0) {
      alert(`❌ Sorry, ${name} is currently out of stock.`);
      return;
    }

    if (prequantity > availableStock) {
      alert(`⚠️ Only ${availableStock} units available. Please reduce quantity.`);
      return;
    }

    if (prequantity < 1) {
      alert(quantityError);
      return;
    }

    if (!color) {
      alert("Please select a color before adding to cart.");
      return;
    }

    // Guest kullanıcı: localStorage sepetine ekle ve çık
    if (!user) {
      saveGuestCart();
      alert("Added to cart. Please sign in to checkout.");
      setQuantity(1);
      setColor("");
      return;
    }

    if (!user) {
      localStorage.setItem("redirectAfterLogin", `/shop/${id}`);
      navigate("/login");
      return;
    }

    try {
      const res = await api.post(
        "/api/cart",
        { productId: id, quantity: prequantity },
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

    setQuantity(1);
    setColor("");
  };

  // ✅ Quick checkout button logic
  const handleCheckout = async (e) => {
    e.preventDefault();
    await handleSubmit(e);
    navigate("/cart-page");
  };

  return (
    <div>
      <div>
        <h4>{name}</h4>
        <div className="rating">
          <Rating value={item?.ratings} count={item?.ratingsCount} />
        </div>
        <h4>${price}</h4>
        <h6>{seller}</h6>

        {stock > 0 ? (
          <p style={{ color: "green", fontWeight: "500" }}>✅ In Stock: {stock} available</p>
        ) : (
          <p style={{ color: "red", fontWeight: "500" }}>❌ Out of Stock</p>
        )}
        <p>{description || "Description not available."}</p>
        <div className="mt-3">
          <div><strong>ID:</strong> {id || "-"}</div>
          <div><strong>Model:</strong> {model || "-"}</div>
          <div><strong>Serial Number:</strong> {serialNumber || "-"}</div>
          <div><strong>Warranty:</strong> {warranty || "-"}</div>
          <div><strong>Distributor:</strong> {distributor || seller || "-"}</div>
        </div>
      </div>

      <div>
        <form onSubmit={handleSubmit}>
          <div className="select-product color">
            <select value={color} onChange={handleColorChange} required>
              <option value="">Select Color</option>
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
