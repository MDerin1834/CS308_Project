import React, { useEffect, useState } from "react";
import "../components/modal.css";
import Modal from "react-bootstrap/Modal";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

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

  // Reset error state when modal opens
  useEffect(() => {
    if (show) {
      setError("");
      setProcessing(false);
    }
  }, [show]);

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
          { productId: it.id, quantity: it.quantity },
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
    if (!items || items.length === 0) {
      setError("Your cart is empty. Please add items first.");
      return;
    }

    if (
      !shipping.fullName ||
      !shipping.addressLine1 ||
      !shipping.city ||
      !shipping.country ||
      !shipping.postalCode
    ) {
      setError("Please fill all required shipping fields");
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
        { shippingAddress: shipping },
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
            invoicePdfBase64: payRes.data?.invoicePdfBase64,
            invoiceFileName: payRes.data?.invoiceFileName,
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
          value={shipping.fullName}
          onChange={(e) =>
            setShipping({ ...shipping, fullName: e.target.value })
          }
        />
        <input
          className="form-control mb-2"
          style={{ width: "100%" }}
          placeholder="Address Line 1"
          value={shipping.addressLine1}
          onChange={(e) =>
            setShipping({ ...shipping, addressLine1: e.target.value })
          }
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
            value={shipping.city}
            onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
          />
          <input
            className="form-control"
            style={{ width: "100%" }}
            placeholder="Country"
            value={shipping.country}
            onChange={(e) =>
              setShipping({ ...shipping, country: e.target.value })
            }
          />
          <input
            className="form-control"
            style={{ width: "100%" }}
            placeholder="Postal Code"
            value={shipping.postalCode}
            onChange={(e) =>
              setShipping({ ...shipping, postalCode: e.target.value })
            }
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
            value={card.cardHolder}
            onChange={(e) =>
              setCard({ ...card, cardHolder: e.target.value })
            }
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
            value={card.cardNumber}
            onChange={(e) =>
              setCard({ ...card, cardNumber: e.target.value })
            }
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
              value={card.expiryMonth}
              onChange={(e) =>
                setCard({ ...card, expiryMonth: e.target.value })
              }
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
              value={card.expiryYear}
              onChange={(e) =>
                setCard({ ...card, expiryYear: e.target.value })
              }
            />
          </div>
          <div>
            <label className="form-label">CVV</label>
            <input
              type="text"
              name="cvv"
              className="form-control"
              required
              value={card.cvv}
              onChange={(e) => setCard({ ...card, cvv: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="text-end" style={{ paddingTop: "12px" }}>
        <button
          className="btn btn-primary"
          onClick={handleOrderConfirm}
          disabled={processing}
        >
          {processing ? "Processing..." : "Confirm & Pay"}
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
