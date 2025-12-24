import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/images/logo/logo.png";
import { AuthContext } from "../contexts/AuthProvider";
import NotificationBell from "./NotificationBell";


const NavItems = () => {
  const [menuToggle, setMenuToggle] = useState(false);
  const [socialToggle, setSocialToggle] = useState(false);
  const [headerFixed, setHeaderFixed] = useState(false);

  const { user, logOut } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logOut()
      .then(() => {
        navigate("/");
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  };

  window.addEventListener("scroll", () => {
    if (window.scrollY > 200) {
      setHeaderFixed(true);
    } else {
      setHeaderFixed(false);
    }
  });

  return (
    <header
      className={`header-section style-4 ${
        headerFixed ? "header-fixed fadeInUp" : ""
      }`}
    >
      <div className={`header-top d-md-none ${socialToggle ? "open" : ""}`}>
        <div className="container">
          <div className="header-top-area">
            <Link to="/sign-up" className="lab-btn me-3">
              <span>Create Account</span>
            </Link>
            <Link to="/login">
              <span>Log In</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="header-bottom">
        <div className="container">
          <div className="header-wrapper">
            <div className="logo-search-acte">
              <div className="logo">
                <Link to="/">
                  <img src={logo} alt="Logo" />
                </Link>
              </div>
            </div>

            <div className="menu-area">
              <div className="menu">
                <ul className={`lab-ul ${menuToggle ? "active" : ""}`}>
                  <li>
                    <Link to="/">Home</Link>
                  </li>
                  <li>
                    <Link to="/shop">Shop</Link>
                  </li>
                  {(!user || user.role !== "sales_manager") && (
                    <li>
                      <Link to="/blog">Blog</Link>
                    </li>
                  )}
                </ul>
              </div>

              <div className="d-none d-md-flex align-items-center gap-3">
                <NotificationBell />
                {user && user.role !== "product_manager" && user.role !== "sales_manager" && (
                  <Link to="/wishlist">
                    <i className="icofont-heart-alt"></i>
                  </Link>
                )}

                {user && user.role !== "product_manager" && user.role !== "sales_manager" && (
                  <Link to="/past-orders">
                    <i className="icofont-box"></i>
                  </Link>
                )}
                {user && user.role === "customer" && (
                  <Link to="/profile">
                    <i className="icofont-user"></i>
                  </Link>
                )}
                {user && user.role === "product_manager" && (
                  <Link to="/deliveries">
                    <i className="icofont-vehicle-delivery-van"></i>
                  </Link>
                )}
                {user && user.role === "product_manager" && (
                  <Link to="/comments/pending">
                    <i className="icofont-speech-comments"></i>
                  </Link>
                )}
                {user && user.role === "product_manager" && (
                  <Link to="/categories/manage">
                    <i className="icofont-tags"></i>
                  </Link>
                )}
                {user && user.role === "sales_manager" && (
                  <Link to="/sales/invoices">
                    <i className="icofont-print"></i>
                  </Link>
                )}
                {user && user.role === "sales_manager" && (
                  <Link to="/sales/discounts">
                    <i className="icofont-sale-discount"></i>
                  </Link>
                )}
                {user && user.role === "sales_manager" && (
                  <Link to="/refunds/pending">
                    <i className="icofont-refresh"></i>
                  </Link>
                )}

                {(!user || (user.role !== "product_manager" && user.role !== "sales_manager")) && (
                  <Link to="/cart-page">
                    <i className="icofont-cart-alt"></i>
                  </Link>
                )}

                {user ? (
                  <a href="#" onClick={handleLogout} className="lab-btn">
                    <span>Log Out</span>
                  </a>
                ) : (
                  <>
                    <Link
                      to="/sign-up"
                      className="lab-btn"
                    >
                      <span>Create Account</span>
                    </Link>
                    <Link to="/login">
                      <span>Log In</span>
                    </Link>
                  </>
                )}
              </div>

              <div
                className={`header-bar d-lg-none ${menuToggle ? "active" : ""}`}
                onClick={() => setMenuToggle(!menuToggle)}
              >
                <span></span>
                <span></span>
                <span></span>
              </div>

              <div
                className="ellepsis-bar d-md-none"
                onClick={() => setSocialToggle(!socialToggle)}
              >
                <i className="icofont-info-square"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavItems;
