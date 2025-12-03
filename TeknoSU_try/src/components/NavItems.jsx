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
              {user ? (
                // Kullanıcı GİRİŞ YAPMIŞSA (user objesi varsa)
                <>
                  <div className="d-none d-md-block">

                    {/* ❤️ WISHLIST ICON — YENİ EKLENDİ */}
                    <Link to="/wishlist" className="me-3">
                      <i className="icofont-heart-alt"></i>
                    </Link>

                    {/* Profil yerine CART */}
                    <Link to="/cart-page" className="me-3"> 
                        <i className="icofont-cart-alt"></i>
                        {/* <span>{user.username || user.email}</span> */}
                    </Link>

                    {/* Logout Butonu */}
                    <a
                      href="#"
                      onClick={handleLogout}
                      className="lab-btn"
                    >
                      <span>Log Out</span>
                    </a>
                  </div>
                </>
              ) : (
                // Kullanıcı GİRİŞ YAPMAMIŞSA (user objesi null ise)
                <>
                  <Link
                    to="/sign-up"
                    className="lab-btn me-3 d-none d-md-block"
                  >
                    <span>Create Account</span>
                  </Link>
                  <Link to="/login" className="d-none d-md-block">
                    <span>Log In</span>
                  </Link>
                </>
              )}

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
