import React, { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthProvider";
import LoadingOverlay from "../components/LoadingOverlay"; // ⭐ Import overlay

const title = "Register Now";
const socialTitle = "Register With Social Media";
const btnText = "Get Started Now";

const Signup = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false); // ⭐ Loading state

  const { signUpWithGmail, createUser } = useContext(AuthContext);

  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from?.pathname || "/";

  // Google signup
  const handleRegister = () => {
    setLoading(true);
    signUpWithGmail()
      .then((result) => {
        const user = result.user;
        localStorage.setItem("user", JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: user.displayName || "User",
        }));
        navigate(from, { replace: true });
      })
      .catch((error) => console.log(error))
      .finally(() => setLoading(false));
  };

  // Email & password signup
  const handleSignup = (event) => {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value;
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    if (password !== confirmPassword) {
      setErrorMessage("Passwords don't match! Please provide correct password");
      return;
    }

    setErrorMessage("");
    setLoading(true); // ⭐ Show overlay

    createUser(email, password)
      .then((userCredential) => {
        const user = userCredential.user;

        localStorage.setItem("user", JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: user.displayName || "User",
        }));

        alert("Account Created Successfully!");
        navigate(from, { replace: true });
      })
      .catch((error) => setErrorMessage(error.message))
      .finally(() => setLoading(false)); // ⭐ Hide overlay
  };

  return (
    <div>
      {/* ⭐ Show full-page loading overlay */}
      {loading && <LoadingOverlay />}

      <div className="login-section padding-tb section-bg">
        <div className="container">
          <div className="account-wrapper">
            <h3 className="title">{title}</h3>
            <form className="account-form" onSubmit={handleSignup}>
              <div className="form-group">
                <input type="text" name="name" placeholder="User Name" required />
              </div>
              <div className="form-group">
                <input type="email" name="email" placeholder="Email" required />
              </div>
              <div className="form-group">
                <input type="password" name="password" placeholder="Password" required />
              </div>
              <div className="form-group">
                <input type="password" name="confirmPassword" placeholder="Confirm Password" required />
              </div>

              {/* Show error message */}
              {errorMessage && (
                <div className="error-message text-danger">
                  {errorMessage}
                </div>
              )}

              <div className="form-group">
                <button className="lab-btn">
                  <span>{btnText}</span>
                </button>
              </div>
            </form>

            <div className="account-bottom">
              <span className="d-block cate pt-10">
                Are you a member? <Link to="/login">Login</Link>
              </span>
              <span className="or"><span>or</span></span>

              <h5 className="subtitle">{socialTitle}</h5>
              <ul className="lab-ul social-icons justify-content-center">
                <li>
                  <button onClick={handleRegister} className="github">
                    <i className="icofont-github"></i>
                  </button>
                </li>
                <li>
                  <a href="/" className="facebook"><i className="icofont-facebook"></i></a>
                </li>
                <li>
                  <a href="/" className="twitter"><i className="icofont-twitter"></i></a>
                </li>
                <li>
                  <a href="/" className="linkedin"><i className="icofont-linkedin"></i></a>
                </li>
                <li>
                  <a href="/" className="instagram"><i className="icofont-instagram"></i></a>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
