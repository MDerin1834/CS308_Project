import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // useNavigate eklendi
import logo from "../assets/images/logo/logo.png";
import { AuthContext } from "../contexts/AuthProvider"; // ❗️ CONTEXT'İ BURADAN ALIYOR

const NavItems = () => {
  const [menuToggle, setMenuToggle] = useState(false);
  const [socialToggle, setSocialToggle] = useState(false);
  const [headerFixed, setHeaderFixed] = useState(false);

  // AuthProvider'dan kullanıcı bilgilerini ve logout fonksiyonunu al
  const { user, logOut } = useContext(AuthContext); // ❗️ KULLANICIYI DİNLİYOR
  const navigate = useNavigate();

  // Logout işlemi
  const handleLogout = () => {
    logOut()
      .then(() => {
        // Başarılı logout sonrası ana sayfaya yönlendir
        navigate("/");
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  };

  // Listen for scroll
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
      {/* Header Top (Adres, Sosyal Medya vb.) */}
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

      {/* Header Bottom (Logo, Menü, Login/Logout) */}
      <div className="header-bottom">
        <div className="container">
          <div className="header-wrapper">
            {/* Logo */}
            <div className="logo-search-acte">
              <div className="logo">
                <Link to="/">
                  <img src={logo} alt="Logo" />
                </Link>
              </div>
            </div>

            {/* Menü Alanı */}
            <div className="menu-area">
              <div className="menu">
                <ul className={`lab-ul ${menuToggle ? "active" : ""}`}>
                  <li>
                    <Link to="/">Home</Link>
                  </li>
                  <li>
                    <Link to="/shop">Shop</Link>
                  </li>
                  <li>
                    <Link to="/blog">Blog</Link>
                  </li>
                  <li>
                    <Link to="/about">About</Link>
                  </li>
                  <li>
                    <Link to="/contact">Contact</Link>
                  </li>
                </ul>
              </div>

              {/* ❗️ GİRİŞ DURUMUNA GÖRE DEĞİŞEN BÖLÜM */}
              <div className="d-none d-md-block">
                {/* ❤️ WISHLIST ICON — sadece login için mantıklı, ama guestte de zarar yok; yine de login kontrolü */}
                {user && user.role !== "product_manager" && (
                  <Link to="/wishlist" className="me-3">
                    <i className="icofont-heart-alt"></i>
                  </Link>
                )}

                {/* 📦 MY ORDERS yalnızca login için */}
                {user && user.role !== "product_manager" && (
                  <Link to="/past-orders" className="me-3">
                    <i className="icofont-box"></i>
                  </Link>
                )}
                {user && user.role === "product_manager" && (
                  <Link to="/deliveries" className="me-3">
                    <i className="icofont-vehicle-delivery-van"></i>
                  </Link>
                )}
                {user && user.role === "product_manager" && (
                  <Link to="/comments/pending" className="me-3">
                    <i className="icofont-speech-comments"></i>
                  </Link>
                )}

                {/* Cart sadece product_manager olmayanlar için */}
                {(!user || user.role !== "product_manager") && (
                  <Link to="/cart-page" className="me-3">
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
                      className="lab-btn me-3"
                    >
                      <span>Create Account</span>
                    </Link>
                    <Link to="/login">
                      <span>Log In</span>
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Menu Toggler */}
              <div
                className={`header-bar d-lg-none ${menuToggle ? "active" : ""}`}
                onClick={() => setMenuToggle(!menuToggle)}
              >
                <span></span>
                <span></span>
                <span></span>
              </div>

              {/* Social Toggler (Mobile) */}
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
