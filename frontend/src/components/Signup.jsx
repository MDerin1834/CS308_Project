import React, { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthProvider";
import LoadingOverlay from "../components/LoadingOverlay"; // ⭐ Import overlay
import countryCities from "./countryCities";

const title = "Register Now";
const socialTitle = "Register With Social Media";
const btnText = "Get Started Now";

const Signup = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false); // ⭐ Loading state

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    fullName: "",
    email: "",
    taxId: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    country: "",
    postalCode: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      const name = formData.name.trim();
      const fullName = formData.fullName.trim();
      const email = formData.email.trim();
      if (!name || !fullName || !email) {
        setErrorMessage("Please fill in all fields");
        return;
      }
      if (!email.includes("@")) {
        setErrorMessage("Please enter a valid email address");
        return;
      }
    } else if (step === 2) {
      if (!formData.taxId || !formData.addressLine1 || !formData.city || !formData.country || !formData.postalCode) {
        setErrorMessage("Please fill in all required address fields");
        return;
      }
    }
    setErrorMessage("");
    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setErrorMessage("");
    setStep((prev) => prev - 1);
  };

  // Email & password signup
  const handleSignup = (event) => {
    event.preventDefault();

    if (step < 3) {
      handleNext();
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords don't match! Please provide correct password");
      return;
    }

    setErrorMessage("");
    setLoading(true); // ⭐ Show overlay

    registerUser(formData.name.trim(), formData.email.trim(), formData.password, {
      fullName: formData.fullName.trim(),
      taxId: formData.taxId.trim(),
      homeAddress: {
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim(),
        city: formData.city.trim(),
        country: formData.country.trim(),
        postalCode: formData.postalCode.trim(),
        phone: formData.phone.trim(),
      },
    })
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

            {/* Step Indicator */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "25px", padding: "0 20px" }}>
              <span style={{ fontWeight: step === 1 ? "bold" : "normal", color: step === 1 ? "#f16126" : "#555" }}>1. Personal</span>
              <span style={{ fontWeight: step === 2 ? "bold" : "normal", color: step === 2 ? "#f16126" : "#555" }}>2. Address</span>
              <span style={{ fontWeight: step === 3 ? "bold" : "normal", color: step === 3 ? "#f16126" : "#555" }}>3. Security</span>
            </div>

            <form className="account-form" onSubmit={handleSignup}>
              {step === 1 && (
                <>
                  <div className="form-group">
                    <input type="text" name="name" placeholder="User Name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                  </div>
                </>
              )}

             {step === 2 && (
              <>
                {/* Country */}
                <div className="form-group">
                  <select
                    name="country"
                    value={formData.country}
                    onChange={(e) => {
                      handleChange(e);
                      setFormData(prev => ({ ...prev, city: "" }));
                    }}
                    required
                  >
                    <option value="">Select Country</option>
                    {Object.keys(countryCities).map(country => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
                {/* City*/}
                {formData.country && formData.country !== "Other" && (
                  <div className="form-group">
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select City</option>
                      {countryCities[formData.country]?.map(city => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {formData.country === "Other" && (
                  <>
                    <div className="form-group">
                      <input
                        type="text"
                        name="country"
                        placeholder="Country"
                        value={formData.country === "Other" ? "" : formData.country}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </>
                )}
                {formData.country === "Other" && (
                  <div className="form-group">
                    <input
                      type="text"
                      name="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={handleChange}
                      required
                    />
                  </div>
                )}
                <div className="form-group">
                  <input
                    type="text"
                    name="taxId"
                    placeholder="Tax ID"
                    value={formData.taxId}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    name="addressLine1"
                    placeholder="Address Line 1"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    name="addressLine2"
                    placeholder="Address Line 2 (Optional)"
                    value={formData.addressLine2}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    name="postalCode"
                    placeholder="Postal Code"
                    value={formData.postalCode}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    name="phone"
                    placeholder="Phone (Optional)"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}


              {step === 3 && (
                <>
                  <div className="form-group">
                    <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
                  </div>
                </>
              )}

              {/* Show error message */}
              {errorMessage && (
                <div className="error-message text-danger">
                  {errorMessage}
                </div>
              )}

              <div className="form-group" style={{ display: "flex", gap: "10px" }}>
                {step > 1 && (
                  <button type="button" className="lab-btn" onClick={handlePrev} style={{ backgroundColor: "#333" }}>
                    <span>Previous</span>
                  </button>
                )}
                {step < 3 ? (
                  <button type="button" className="lab-btn" onClick={handleNext}>
                    <span>Next</span>
                  </button>
                ) : (
                  <button type="submit" className="lab-btn">
                    <span>{btnText}</span>
                  </button>
                )}
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
