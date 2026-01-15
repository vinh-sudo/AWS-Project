import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import "./ForgotPasswordPage.css";
import imsLogo from "../../assets/ims2.jpg";

const ForgotPasswordPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
  });

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema,
    onSubmit: (values) => {
      // TODO: replace with real submit logic
      console.log("Forgot password submit", values);
      setIsSubmitted(true);
    },
  });

  return (
    <div className="forgot-password-wrapper">
      <div className="forgot-password-container">
        <div className="forgot-password-heading">Forgot Password</div>

        {!isSubmitted ? (
          <>
            <p className="forgot-password-description">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
            <form
              className="forgot-password-form"
              onSubmit={formik.handleSubmit}
              noValidate
            >
              <input
                required
                className={`forgot-password-input ${
                  formik.touched.email && formik.errors.email
                    ? "input-error"
                    : ""
                }`}
                type="email"
                name="email"
                id="email"
                placeholder="E-mail"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.email && formik.errors.email && (
                <div className="input-error-text">{formik.errors.email}</div>
              )}
              <input
                className="forgot-password-button"
                type="submit"
                value="Send Reset Link"
              />
            </form>
          </>
        ) : (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <p>We've sent a password reset link to your email address.</p>
            <p className="check-inbox">Please check your inbox.</p>
          </div>
        )}

        <div className="back-to-login">
          <Link to="/login">← Back to Sign In</Link>
        </div>

        <div className="logo-row">
          <img src={imsLogo} alt="IMS Logo" className="logo-item" />
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
