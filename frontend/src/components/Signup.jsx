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

  const { signUpWithGmail, registerUser } = useContext(AuthContext);

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
    const username = form.elements.name?.value?.trim();
    const email = form.elements.email?.value?.trim();
    const password = form.elements.password?.value;
    const confirmPassword = form.elements.confirmPassword?.value;

    if (!username) {
      setErrorMessage("User name is required");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords don't match! Please provide correct password");
      return;
    }

    setErrorMessage("");
    setLoading(true); // ⭐ Show overlay

    registerUser(username, email, password)
      .then((result) => {
        if (result.success) {
          alert(result.message || "Account Created Successfully!");
          navigate(from, { replace: true });
        } else {
          setErrorMessage(result.message || "Registration failed");
        }
      })
      .catch((error) => setErrorMessage(error.message || "Registration failed"))
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
