
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { AuthContext } from "../contexts/AuthProvider";
import Rating from "../components/Rating";
import { WishlistContext } from "../contexts/WishlistContext";

const ProductDisplay = ({ item, onDiscountUpdate }) => {
  const navigate = useNavigate(); // ✅ Added for checkout redirect
  const { user } = useContext(AuthContext);
  const {
    id,
    img,
    price,
    originalPrice,
    discountPrice,
    discountPercent,
    name,
    quantity,
    seller,
    stock,
    description,
    model,
    serialNumber,
    warranty,
    distributor,
    category,
  } = item;

  const [prequantity, setQuantity] = useState(quantity);
  const [color, setColor] = useState("");
  const isSalesManager = user?.role === "sales_manager";
  const [discountInputs, setDiscountInputs] = useState({ percent: "", price: "" });
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [discountFeedback, setDiscountFeedback] = useState("");
  const { addToWishlist } = useContext(WishlistContext);

  const basePrice = Number(
    originalPrice ??
      item?.basePrice ??
      price ??
      item?.price ??
      0
  );
  const discountedPrice = Number(
    discountPrice ??
      item?.discountedPrice ??
      price ??
      item?.price ??
      0
  );
  const hasDiscount =
    basePrice > 0 && discountedPrice > 0 && discountedPrice < basePrice;
  const effectivePrice = hasDiscount ? discountedPrice : basePrice || discountedPrice;
  const derivedPercent = hasDiscount
    ? Math.round(((basePrice - discountedPrice) / basePrice) * 100)
    : null;
  const displayDiscountPercent =
    Number.isFinite(discountPercent) && discountPercent > 0
      ? discountPercent
      : derivedPercent;

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
        price: effectivePrice,
        quantity: prequantity,
        img: img || item.imageURL,
      });
    } else {
      next[idx] = {
        ...next[idx],
        quantity: (next[idx].quantity || 0) + prequantity,
        price: effectivePrice,
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

    if (isSalesManager) {
      alert("Sales managers can view products but cannot place orders.");
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

  const handleAddWishlist = async () => {
    const existingUser = user || JSON.parse(localStorage.getItem("user"));
    if (!existingUser) {
      localStorage.setItem("redirectAfterLogin", `/shop/${id}`);
      navigate("/login");
      return;
    }
    const res = await addToWishlist(item);
    if (res?.message) {
      alert(res.message);
    }
  };

  // ✅ Quick checkout button logic
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (isSalesManager) {
      alert("Sales managers can browse products but cannot checkout.");
      return;
    }
    await handleSubmit(e);
    navigate("/cart-page");
  };

  const applyDiscount = async () => {
    setDiscountFeedback("");
    const payload = {};
    if (discountInputs.percent) payload.discountPercent = Number(discountInputs.percent);
    if (discountInputs.price) payload.discountPrice = Number(discountInputs.price);
    if (!payload.discountPercent && !payload.discountPrice) {
      setDiscountFeedback("Enter a percent or price to apply a discount.");
      return;
    }
    setSavingDiscount(true);
    try {
      const res = await api.patch(`/api/products/${id}/discount`, payload, {
        validateStatus: () => true,
      });
      if (res.status === 200 && res.data?.product) {
        onDiscountUpdate?.(res.data.product);
        const notified = res.data?.wishlistNotifications;
        const suffix =
          typeof notified === "number" && notified > 0
            ? ` Wishlist notifications sent to ${notified} customer(s).`
            : "";
        setDiscountFeedback(`Discount applied.${suffix}`);
      } else {
        setDiscountFeedback(res.data?.message || "Could not apply discount.");
      }
    } catch (err) {
      setDiscountFeedback(err?.response?.data?.message || "Could not apply discount.");
    } finally {
      setSavingDiscount(false);
    }
  };

  const clearDiscount = async () => {
    setSavingDiscount(true);
    setDiscountFeedback("");
    try {
      const res = await api.patch(
        `/api/products/${id}/discount`,
        { clear: true },
        { validateStatus: () => true }
      );
      if (res.status === 200 && res.data?.product) {
        onDiscountUpdate?.(res.data.product);
        setDiscountInputs({ percent: "", price: "" });
        setDiscountFeedback("Discount cleared.");
      } else {
        setDiscountFeedback(res.data?.message || "Could not clear discount.");
      }
    } catch (err) {
      setDiscountFeedback(err?.response?.data?.message || "Could not clear discount.");
    } finally {
      setSavingDiscount(false);
    }
  };

  return (
    <div>
      <div>
        <h4>{name}</h4>
        <div className="rating">
          <Rating value={item?.ratings} count={item?.ratingsCount} />
        </div>
        <div className="d-flex align-items-center gap-2">
          <h4 className="mb-0">${Number(effectivePrice || 0).toFixed(2)}</h4>
          {hasDiscount && (
            <>
              <span className="text-muted text-decoration-line-through">
                ${Number(basePrice).toFixed(2)}
              </span>
              {displayDiscountPercent ? (
                <span className="badge bg-danger">-{displayDiscountPercent}%</span>
              ) : null}
            </>
          )}
        </div>
        {!hasDiscount && basePrice > 0 && (
          <small className="text-muted">Price based on latest listing.</small>
        )}
        <h6>{seller}</h6>
        <p className="mb-2">
          <strong>Category:</strong> {category || "-"}
        </p>

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

      {isSalesManager && (
        <div className="border rounded p-3 mb-3">
          <h6 className="mb-2">Apply Discount</h6>
          <div className="row g-2">
            <div className="col-6">
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="%"
                min="1"
                max="99"
                value={discountInputs.percent}
                onChange={(e) =>
                  setDiscountInputs((prev) => ({ ...prev, percent: e.target.value }))
                }
              />
            </div>
            <div className="col-6">
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="Price"
                min="0"
                step="0.01"
                value={discountInputs.price}
                onChange={(e) =>
                  setDiscountInputs((prev) => ({ ...prev, price: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="d-flex gap-2 mt-2">
            <button
              className="btn btn-sm btn-primary"
              onClick={applyDiscount}
              disabled={savingDiscount}
            >
              {savingDiscount ? "Saving..." : "Apply"}
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={clearDiscount}
              disabled={savingDiscount}
            >
              Clear
            </button>
          </div>
          {discountFeedback && (
            <small className="d-block mt-2 text-muted">{discountFeedback}</small>
          )}
        </div>
      )}

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
            disabled={stock <= 0 || isSalesManager}
            style={{
              opacity: stock <= 0 || isSalesManager ? 0.6 : 1,
              cursor: stock <= 0 || isSalesManager ? "not-allowed" : "pointer",
            }}
          >
            <span>
              {isSalesManager
                ? "Purchasing Disabled"
                : stock > 0
                ? "Add To Cart"
                : "Out of Stock"}
            </span>
          </button>

          <button
            className="lab-btn bg-primary"
            onClick={handleCheckout}
            disabled={isSalesManager || stock <= 0}
            style={{
              opacity: isSalesManager || stock <= 0 ? 0.6 : 1,
              cursor: isSalesManager || stock <= 0 ? "not-allowed" : "pointer",
            }}
          >
            <span>{isSalesManager ? "Browse Only" : "Check Out"}</span>
          </button>
          {isSalesManager && (
            <p className="mt-2 text-muted" style={{ fontSize: "0.9rem" }}>
              Sales managers can browse catalog details but cannot place orders.
            </p>
          )}
        </form>
      </div>

      <div className="mt-3">
        <button
          type="button"
          className="lab-btn bg-secondary"
          onClick={handleAddWishlist}
        >
          <span>Add to Wishlist</span>
        </button>
      </div>
    </div>
  );
};

export default ProductDisplay;
