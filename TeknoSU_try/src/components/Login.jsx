import React, { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthProvider";
import LoadingOverlay from "../components/LoadingOverlay";

const title = "Login";
const socialTitle = "Login With Social Media";
const btnText = "Submit Now";

const Login = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { signUpWithGmail, login } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from?.pathname || "/";

  // ⭐ HANDLE GOOGLE LOGIN
  const handleRegister = () => {
    setLoading(true);
    signUpWithGmail()
      .then((result) => {
        const user = result.user;

        localStorage.setItem(
          "user",
          JSON.stringify({
            uid: user.uid,
            email: user.email,
            name: user.displayName || "User",
          })
        );

        // ⭐ REDIRECT AFTER LOGIN (guest checkout)
        const redirectPath =
          localStorage.getItem("redirectAfterLogin") || from;
        localStorage.removeItem("redirectAfterLogin");

        setLoading(false);
        navigate(redirectPath, { replace: true });
      })
      .catch((error) => {
        setErrorMessage(error.message);
        setLoading(false);
      });
  };

  // ⭐ HANDLE EMAIL/PASSWORD LOGIN
  const handleLogin = (event) => {
    event.preventDefault();
    setLoading(true);

    const form = event.target;
    const email = form.email.value;
    const password = form.password.value;

    login(email, password)
      .then((result) => {
        // AuthProvider.login zaten token + user'ı (rol dahil) localStorage'a yazıyor.
        // Yine de güncel user'ı rol bilgisiyle birlikte saklayalım.
        if (result?.user) {
          localStorage.setItem("user", JSON.stringify(result.user));
        }
        if (result?.token) {
          localStorage.setItem("token", result.token);
        }

        // ⭐ REDIRECT AFTER LOGIN (guest checkout)
        const redirectPath =
          localStorage.getItem("redirectAfterLogin") || from;
        localStorage.removeItem("redirectAfterLogin");

        setLoading(false);
        navigate(redirectPath, { replace: true });
      })
      .catch((error) => {
        setErrorMessage("Invalid email or password.");
        setLoading(false);
      });
  };

  return (
    <div>
      {loading && <LoadingOverlay />}

      <div className="login-section padding-tb section-bg">
        <div className="container">
          <div className="account-wrapper">
            <h3 className="title">{title}</h3>

            <form className="account-form" onSubmit={handleLogin}>
              <div className="form-group">
                <input type="email" name="email" placeholder="Email Address *" required />
              </div>

              <div className="form-group">
                <input type="password" name="password" placeholder="Password *" required />
              </div>

              {errorMessage && <div className="text-danger mb-2">{errorMessage}</div>}

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
                <button className="d-block lab-btn">
                  <span>{btnText}</span>
                </button>
              </div>
            </form>

            <div className="account-bottom">
              <span className="d-block cate pt-10">
                Don’t Have an Account? <Link to="/sign-up">Sign Up</Link>
              </span>

              <span className="or"><span>or</span></span>

              <h5 className="subtitle">{socialTitle}</h5>

              <ul className="lab-ul social-icons justify-content-center">
                <li>
                  <button onClick={handleRegister} className="github">
                    <i className="icofont-github"></i>
                  </button>
                </li>
                <li><a href="/" className="facebook"><i className="icofont-facebook"></i></a></li>
                <li><a href="/" className="twitter"><i className="icofont-twitter"></i></a></li>
                <li><a href="/" className="linkedin"><i className="icofont-linkedin"></i></a></li>
                <li><a href="/" className="instagram"><i className="icofont-instagram"></i></a></li>
              </ul>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
