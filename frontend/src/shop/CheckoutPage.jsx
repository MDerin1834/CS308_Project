import React, { useContext, useEffect, useState } from "react";
import "../components/modal.css";
import Modal from "react-bootstrap/Modal";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { AuthContext } from "../contexts/AuthProvider";

// useModal: true when rendered inside CartPage (modal), false when used as a standalone page (/check-out)
const CheckoutPage = (props = {}) => {
  const {
    cartItems = [],
    orderTotal = 0,
    show = false,
    onClose = () => {},
    useModal = true,
  } = props;

  const [items, setItems] = useState(cartItems);
  const [total, setTotal] = useState(orderTotal);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [shipping, setShipping] = useState({
    fullName: "",
    addressLine1: "",
    city: "",
    country: "",
    postalCode: "",
  });
  const [card, setCard] = useState({
    cardHolder: "",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
  });
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isSalesManager = user?.role === "sales_manager";

  const handleShippingField =
    (field) =>
    (e) =>
      setShipping((prev) => ({ ...prev, [field]: e.target.value }));

  const handleCardField =
    (field) =>
    (e) =>
      setCard((prev) => ({ ...prev, [field]: e.target.value }));

  // Reset error state when modal opens
  useEffect(() => {
    if (show) {
      setError("");
      setProcessing(false);
    }
    if (isSalesManager) {
      setError("Sales managers can browse orders but cannot place purchases.");
    }
  }, [show, isSalesManager]);

  // Always refresh cart from server when possible to avoid "empty cart" errors
  useEffect(() => {
    const needsFetch = !cartItems || cartItems.length === 0;
    if (!needsFetch) {
      setItems(cartItems);
      setTotal(orderTotal);
      return;
    }
    api
      .get("/api/cart", { validateStatus: () => true })
      .then((res) => {
        if (res.status === 200) {
          setItems(res.data?.items || []);
          setTotal(res.data?.subtotal || 0);
        } else {
          setError(res.data?.message || "Cart could not be loaded");
        }
      })
      .catch((err) =>
        setError(err?.response?.data?.message || "Cart could not be loaded")
      );
  }, [cartItems, orderTotal]);

  const syncCartToServer = async () => {
    if (!items || items.length === 0) return true;
    try {
      const tasks = items.map((it) =>
        api.post(
          "/api/cart",
          { productId: it.id, quantity: it.quantity, replace: true },
          { validateStatus: () => true }
        )
      );
      const results = await Promise.all(tasks);
      const failed = results.find((r) => r.status < 200 || r.status >= 300);
      if (failed) {
        setError(failed.data?.message || "Failed to sync cart with server");
        return false;
      }
      return true;
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to sync cart with server");
      return false;
    }
  };

  const handleOrderConfirm = async () => {
    if (isSalesManager) {
      setError("Sales managers can browse orders but cannot place purchases.");
      return;
    }
    if (!items || items.length === 0) {
      setError("Your cart is empty. Please add items first.");
      return;
    }

    const normalizedShipping = {
      fullName: shipping.fullName.trim(),
      addressLine1: shipping.addressLine1.trim(),
      city: shipping.city.trim(),
      country: shipping.country.trim(),
      postalCode: shipping.postalCode.trim(),
    };
    const missingShipping = [];
    if (!normalizedShipping.fullName) missingShipping.push("Full Name");
    if (!normalizedShipping.addressLine1) missingShipping.push("Address Line 1");
    if (!normalizedShipping.city) missingShipping.push("City");
    if (!normalizedShipping.country) missingShipping.push("Country");
    if (!normalizedShipping.postalCode) missingShipping.push("Postal Code");
    if (missingShipping.length > 0) {
      setError(`Please fill all required shipping fields: ${missingShipping.join(", ")}`);
      return;
    }

    if (
      !card.cardHolder ||
      !card.cardNumber ||
      !card.expiryMonth ||
      !card.expiryYear ||
      !card.cvv
    ) {
      setError("Please fill all required card fields");
      return;
    }

    try {
      setProcessing(true);
      const synced = await syncCartToServer();
      if (!synced) {
        setProcessing(false);
        return;
      }

      const orderRes = await api.post(
        "/api/orders",
        { shippingAddress: normalizedShipping },
        { validateStatus: () => true }
      );

      if (orderRes.status !== 201 && orderRes.status !== 200) {
        setError(orderRes.data?.message || "Order could not be created");
        return;
      }

      const createdOrder = orderRes.data?.order;
      const orderId = createdOrder?.id || createdOrder?._id;
      const newOrderTotal = createdOrder?.total ?? total;

      const payRes = await api.post(
        "/api/payment/checkout",
        {
          orderId,
          amount: newOrderTotal,
          cardNumber: card.cardNumber,
          expiryMonth: card.expiryMonth,
          expiryYear: card.expiryYear,
          cvv: card.cvv,
          cardHolder: card.cardHolder,
        },
        { validateStatus: () => true }
      );

      if (payRes.status === 200) {
        setItems([]);
        setTotal(0);
        if (useModal) {
          onClose();
        }
        navigate("/review-order", {
          state: {
            items: createdOrder?.items || items,
            total: newOrderTotal,
            subtotal: createdOrder?.subtotal,
            tax: createdOrder?.tax,
            shipping: createdOrder?.shipping,
            orderId,
            invoiceNumber: payRes.data?.invoiceNumber,
            invoicePdfBase64: payRes.data?.invoicePdfBase64,
            invoiceFileName: payRes.data?.invoiceFileName,
            shippingAddress: createdOrder?.shippingAddress,
            paidAt: createdOrder?.paidAt || new Date().toISOString(),
            emailSent: payRes.data?.emailSent,
          },
        });
      } else {
        setError(payRes.data?.message || "Payment failed");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Order could not be created");
    } finally {
      setProcessing(false);
    }
  };

  const renderForm = () => (
    <div
      className="modal-body"
      style={{
        padding: "20px",
        position: "relative",
        paddingBottom: "80px",
        maxHeight: "70vh",
        overflowY: "auto",
      }}
    >
      <div style={{ minHeight: "48px", marginBottom: "10px" }}>
        {error && (
          <div className="alert alert-danger" style={{ fontSize: "14px", padding: "8px 12px" }}>
            {error}
          </div>
        )}
      </div>
      <div className="mb-3">
        <h6>Shipping Information</h6>
        <input
          className="form-control mb-2"
          style={{ width: "100%" }}
          placeholder="Full Name"
          name="fullName"
          autoComplete="name"
          value={shipping.fullName}
          onChange={handleShippingField("fullName")}
          onInput={handleShippingField("fullName")}
          onBlur={handleShippingField("fullName")}
        />
        <input
          className="form-control mb-2"
          style={{ width: "100%" }}
          placeholder="Address Line 1"
          name="addressLine1"
          autoComplete="address-line1"
          value={shipping.addressLine1}
          onChange={handleShippingField("addressLine1")}
          onInput={handleShippingField("addressLine1")}
          onBlur={handleShippingField("addressLine1")}
        />
        <div
          className="mb-2"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "10px",
            width: "100%",
            minWidth: 0,
          }}
        >
          <input
            className="form-control"
            style={{ width: "100%" }}
            placeholder="City"
            name="city"
            autoComplete="address-level2"
            value={shipping.city}
            onChange={handleShippingField("city")}
            onInput={handleShippingField("city")}
            onBlur={handleShippingField("city")}
          />
          <input
            className="form-control"
            style={{ width: "100%" }}
            placeholder="Country"
            name="country"
            autoComplete="country"
            value={shipping.country}
            onChange={handleShippingField("country")}
            onInput={handleShippingField("country")}
            onBlur={handleShippingField("country")}
          />
          <input
            className="form-control"
            style={{ width: "100%" }}
            placeholder="Postal Code"
            name="postalCode"
            autoComplete="postal-code"
            value={shipping.postalCode}
            onChange={handleShippingField("postalCode")}
            onInput={handleShippingField("postalCode")}
            onBlur={handleShippingField("postalCode")}
          />
        </div>
        <p className="mb-1">Order Total: ${total.toFixed(2)}</p>
      </div>

      <div className="mb-3">
        <h6>Payment Information</h6>
        <div className="mb-2">
          <label className="form-label">Cardholder Name</label>
          <input
            type="text"
            name="cardHolder"
            className="form-control"
            required
            placeholder="John Doe"
            autoComplete="cc-name"
            value={card.cardHolder}
            onChange={handleCardField("cardHolder")}
            onInput={handleCardField("cardHolder")}
            onBlur={handleCardField("cardHolder")}
          />
        </div>
        <div className="mb-2">
          <label className="form-label">Card Number</label>
          <input
            type="text"
            name="cardNumber"
            className="form-control"
            required
            placeholder="1234 5678 9012 3456"
            autoComplete="cc-number"
            value={card.cardNumber}
            onChange={handleCardField("cardNumber")}
            onInput={handleCardField("cardNumber")}
            onBlur={handleCardField("cardNumber")}
          />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "10px",
            minWidth: 0,
          }}
        >
          <div>
            <label className="form-label">Exp Month</label>
            <input
              type="text"
              name="expiryMonth"
              className="form-control"
              required
              placeholder="MM"
              autoComplete="cc-exp-month"
              value={card.expiryMonth}
              onChange={handleCardField("expiryMonth")}
              onInput={handleCardField("expiryMonth")}
              onBlur={handleCardField("expiryMonth")}
            />
          </div>
          <div>
            <label className="form-label">Exp Year</label>
            <input
              type="text"
              name="expiryYear"
              className="form-control"
              required
              placeholder="YYYY"
              autoComplete="cc-exp-year"
              value={card.expiryYear}
              onChange={handleCardField("expiryYear")}
              onInput={handleCardField("expiryYear")}
              onBlur={handleCardField("expiryYear")}
            />
          </div>
          <div>
            <label className="form-label">CVV</label>
            <input
              type="text"
              name="cvv"
              className="form-control"
              required
              autoComplete="cc-csc"
              value={card.cvv}
              onChange={handleCardField("cvv")}
              onInput={handleCardField("cvv")}
              onBlur={handleCardField("cvv")}
            />
          </div>
        </div>
      </div>

      <div className="text-end" style={{ paddingTop: "12px" }}>
        <button
          className="btn btn-primary"
          onClick={handleOrderConfirm}
          disabled={processing || isSalesManager}
        >
          {processing ? "Processing..." : isSalesManager ? "Purchasing Disabled" : "Confirm & Pay"}
        </button>
      </div>
    </div>
  );

  if (!useModal) {
    return (
      <div className="container padding-tb">
        <h2>Checkout</h2>
        <div className="modal-content mt-3">{renderForm()}</div>
      </div>
    );
  }

  if (!show) return null;

  return (
    <div className="modalCard">
      <Modal
        show={Boolean(show)}
        onHide={onClose}
        animation={false}
        className="modal fade"
        centered
        size="lg"
      >
        <div className="modal-dialog" style={{ maxWidth: "860px", width: "100%" }}>
          <div className="modal-content" style={{ width: "100%" }}>
            <div className="modal-header" style={{ marginBottom: 0 }}>
              <h5 className="modal-title">Checkout</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
            </div>
            {renderForm()}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CheckoutPage;
