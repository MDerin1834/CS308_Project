import React, { useEffect, useState } from "react";
import "../components/modal.css";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

const CheckoutPage = ({ cartItems = [], orderTotal = 0 }) => {
  const [items, setItems] = useState(cartItems);
  const [total, setTotal] = useState(orderTotal);
  const [show, setShow] = useState(false);
  const [activeTab, setActiveTab] = useState("visa");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [shipping, setShipping] = useState({
    fullName: "",
    addressLine1: "",
    city: "",
    country: "",
    postalCode: "",
  });
  const navigate = useNavigate();

  // fallback: fetch cart if no props provided (route access)
  useEffect(() => {
    if (cartItems.length > 0) {
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
      .catch((err) => setError(err?.response?.data?.message || "Cart could not be loaded"));
  }, [cartItems, orderTotal]);

  const handleTabChange = (tabId) => setActiveTab(tabId);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleOrderConfirm = async () => {
    if (!shipping.fullName || !shipping.addressLine1 || !shipping.city || !shipping.country || !shipping.postalCode) {
      setError("Please fill all required shipping fields");
      return;
    }

    try {
      setProcessing(true);
      const res = await api.post(
        "/api/orders",
        { shippingAddress: shipping },
        { validateStatus: () => true }
      );

      if (res.status === 201 || res.status === 200) {
        alert("Your order placed successfully!");
        setItems([]);
        setTotal(0);
        navigate("/review-order", {
          state: { items, total },
        });
      } else {
        setError(res.data?.message || "Order could not be created");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Order could not be created");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="modalCard">
      <Button variant="primary" onClick={handleShow} className="py-2">
        Proceed to Checkout
      </Button>

      <Modal show={show} onHide={handleClose} animation={false} className="modal fade" centered>
        <div className="modal-dialog">
          <h5 className="px-3 mb-3">Select Your Payment Method</h5>
          <div className="modal-content">
            <div className="modal-body">
              {error && <p style={{ color: "red" }}>{error}</p>}
              <div className="mb-3">
                <h6>Shipping Information</h6>
                <input
                  className="form-control mb-2"
                  placeholder="Full Name"
                  value={shipping.fullName}
                  onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
                />
                <input
                  className="form-control mb-2"
                  placeholder="Address Line 1"
                  value={shipping.addressLine1}
                  onChange={(e) => setShipping({ ...shipping, addressLine1: e.target.value })}
                />
                <div className="d-flex gap-2 mb-2">
                  <input
                    className="form-control"
                    placeholder="City"
                    value={shipping.city}
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                  />
                  <input
                    className="form-control"
                    placeholder="Country"
                    value={shipping.country}
                    onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                  />
                  <input
                    className="form-control"
                    placeholder="Postal Code"
                    value={shipping.postalCode}
                    onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
                  />
                </div>
                <p className="mb-1">Order Total: ${total.toFixed(2)}</p>
              </div>
              <div className="tabs mt-3">
                <ul className="nav nav-tabs" id="myTab" role="tablist">
                  <li className="nav-item" role="presentation">
                    <a
                      className={`nav-link ${activeTab === "visa" ? "active" : ""}`}
                      id="visa-tab"
                      data-toggle="tab"
                      href="#visa"
                      role="tab"
                      aria-controls="visa"
                      aria-selected={activeTab === "visa"}
                      onClick={() => handleTabChange("visa")}
                    >
                      <img src="https://i.imgur.com/sB4jftM.png" width="80" />
                    </a>
                  </li>
                  <li className="nav-item" role="presentation">
                    <a
                      className={`nav-link ${activeTab === "paypal" ? "active" : ""}`}
                      id="paypal-tab"
                      data-toggle="tab"
                      href="#paypal"
                      role="tab"
                      aria-controls="paypal"
                      aria-selected={activeTab === "paypal"}
                      onClick={() => handleTabChange("paypal")}
                    >
                      <img src="https://i.imgur.com/yK7EDD1.png" width="80" />
                    </a>
                  </li>
                </ul>
                <div className="tab-content" id="myTabContent">
                  {/* Visa Tab */}
                  <div className={`tab-pane fade ${activeTab === "visa" ? "show active" : ""}`} id="visa" role="tabpanel" aria-labelledby="visa-tab">
                    <div className="mt-4 mx-4">
                      <div className="text-center"><h5>Credit card</h5></div>
                      <div className="form mt-3">
                        <div className="inputbox">
                          <input type="text" name="name" className="form-control" required="required" />
                          <span>Cardholder Name</span>
                        </div>
                        <div className="inputbox">
                          <input type="text" name="name" min="1" max="999" className="form-control" required="required" />
                          <span>Card Number</span> <i className="fa fa-eye"></i>
                        </div>
                        <div className="d-flex flex-row">
                          <div className="inputbox">
                            <input type="text" name="name" min="1" max="999" className="form-control" required="required" />
                            <span>Expiration Date</span>
                          </div>
                          <div className="inputbox">
                            <input type="text" name="name" min="1" max="999" className="form-control" required="required" />
                            <span>CVV</span>
                          </div>
                        </div>
                        <div className="px-5 pay">
                          <button className="btn btn-success btn-block" onClick={handleOrderConfirm} disabled={processing}>
                            Add card
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Paypal Tab */}
                  <div className={`tab-pane fade ${activeTab === "paypal" ? "show active" : ""}`} id="paypal" role="tabpanel" aria-labelledby="paypal-tab">
                    <div className="mx-4 mt-4">
                      <div className="text-center"><h5>Paypal Account Info</h5></div>
                      <div className="form mt-3">
                        <div className="inputbox">
                          <input type="text" name="name" className="form-control" required="required" />
                          <span>Enter your email</span>
                        </div>
                        <div className="inputbox">
                          <input type="text" name="name" min="1" max="999" className="form-control" required="required" />
                          <span>Your Name</span>
                        </div>
                        <div className="d-flex flex-row">
                          <div className="inputbox">
                            <input type="text" name="name" min="1" max="999" className="form-control" required="required" />
                            <span>Extra Info</span>
                          </div>
                          <div className="inputbox">
                            <input type="text" name="name" min="1" max="999" className="form-control" required="required" />
                            <span></span>
                          </div>
                        </div>
                        <div className="pay px-5">
                          <button className="btn btn-primary btn-block" onClick={handleOrderConfirm} disabled={processing}>
                            Add paypal
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 px-4 p-Disclaimer">
                <em>Payment Disclaimer:</em> In no event shall payment or partial payment by Owner for any material or service
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CheckoutPage;
