import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import "./ForgotPasswordPage.css";
import imsLogo from "../../assets/ims2.jpg";
import authService from "../../services/authService";

const ForgotPasswordPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    employeeCode: Yup.string().trim().required("Employee Code is required"),
  });

  const formik = useFormik({
    initialValues: {
      employeeCode: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      const normalizedEmployeeCode = values.employeeCode
        .replace(/\s+/g, "")
        .toUpperCase();

      setIsLoading(true);
      setError("");

      try {
        await authService.requestPasswordReset(normalizedEmployeeCode);
        setIsSubmitted(true);

        // Navigate to OTP verification after 1 second
        setTimeout(() => {
          navigate("/otp-verification", {
            state: { employeeCode: normalizedEmployeeCode },
          });
        }, 1500);
      } catch (err) {
        setError(err.message || "Failed to send OTP. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="forgot-password-wrapper">
      <div className="forgot-password-container">
        <div className="forgot-password-heading">Forgot Password</div>

        {!isSubmitted ? (
          <>
            <p className="forgot-password-description">
              Enter your Employee Code and we'll send an OTP to your registered
              email.
            </p>
            {error && <div className="error-message">{error}</div>}
            <form
              className="forgot-password-form"
              onSubmit={formik.handleSubmit}
              noValidate
            >
              <input
                required
                className={`forgot-password-input ${
                  formik.touched.employeeCode && formik.errors.employeeCode
                    ? "input-error"
                    : ""
                }`}
                type="text"
                name="employeeCode"
                id="employeeCode"
                placeholder="Employee Code"
                value={formik.values.employeeCode}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.employeeCode && formik.errors.employeeCode && (
                <div className="input-error-text">
                  {formik.errors.employeeCode}
                </div>
              )}
              <button
                className="forgot-password-button"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send OTP"}
              </button>
            </form>
          </>
        ) : (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <p>We've sent an OTP to your registered email address.</p>
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
