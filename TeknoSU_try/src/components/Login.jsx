import React, { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthProvider";

const title = "Login";
const btnText = "Submit Now";

const Login = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { login } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const from = location.state?.from?.pathname || "/";

  const handleLogin = async (event) => {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value;
    const password = form.password.value;
    
    setErrorMessage(""); 
    setSuccessMessage(""); 

    try {
      const result = await login(email, password); 

      if (result.success) {
        setSuccessMessage("Giriş başarılı! Yönlendiriliyorsunuz...");
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1500);
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      setErrorMessage("Beklenmedik bir hata oluştu: " + error.message);
    }
  };

  return (
    <div>
      {/* ❗️❗️ Gömülü Stil Bloğu: Arka plan resmini zorla kaldırır ❗️❗️ */}
      <style>{`
        .login-section {
          background-image: none !important;
          background-color: #f9f9f9 !important; /* Temiz bir arka plan rengi */
        }
      `}</style>

      {/* section-bg class'ı kaldırılmıştı, o şekilde kalabilir */}
      <div className="login-section padding-tb">
        <div className="container">
          <div className="account-wrapper">
            <h3 className="title">{title}</h3>

            <form className="account-form" onSubmit={handleLogin}>
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address *"
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Password *"
                  required
                />
              </div>
              
              <div>
                {errorMessage && (
                  <div className="error-message text-danger mb-2">
                    {errorMessage}
                  </div>
                )}
                {successMessage && (
                  <div className="success-message text-success mb-2">
                    {successMessage}
                  </div>
                )}
              </div>

              <div className="form-group">
                <div className="d-flex justify-content-between flex-wrap pt-sm-2">
                  <div className="checkgroup">
                    <input type="checkbox" name="remember" id="remember" />
                    <label htmlFor="remember">Remember Me</label>
                  </div>
                  <Link to="/forgetpass">Forget Password?</Link>
                </div>
              </div>
              <div className="form-group text-center">
                <button className="d-block lab-btn" type="submit">
                  <span>{btnText}</span>
                </button>
              </div>
            </form>
            <div className="account-bottom">
              <span className="d-block cate pt-10">
                Don’t Have any Account? <Link to="/sign-up">Sign Up</Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

