import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import "./ResetPasswordPage.css";
import imsLogo from "../../assets/ims2.jpg";
import authService from "../../services/authService";

const ResetPasswordPage = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Get employeeCode and OTP from navigation state
  const employeeCode = location.state?.employeeCode;
  const otp = location.state?.otp;

  // Redirect if no employeeCode or OTP
  useEffect(() => {
    if (!employeeCode || !otp) {
      navigate("/forgot-password");
    }
  }, [employeeCode, otp, navigate]);

  const validationSchema = Yup.object({
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .matches(/[a-z]/, "Password must contain at least one lowercase letter")
      .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
      .matches(/[0-9]/, "Password must contain at least one number")
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Confirm password is required"),
  });

  const formik = useFormik({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      setError("");

      try {
        await authService.verifyOtpAndResetPassword(
          employeeCode,
          otp,
          values.password,
        );
        setIsSuccess(true);

        // Navigate to login after success
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } catch (err) {
        setError(err.message || "Failed to reset password. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="reset-password-wrapper">
      <div className="reset-password-container">
        <div className="reset-password-heading">Reset Password</div>

        {!isSuccess ? (
          <>
            <p className="reset-password-description">
              Create a new password for your account.
            </p>
            {error && <div className="error-message">{error}</div>}
            <form
              className="reset-password-form"
              onSubmit={formik.handleSubmit}
              noValidate
            >
              <input
                required
                className={`reset-password-input ${
                  formik.touched.password && formik.errors.password
                    ? "input-error"
                    : ""
                }`}
                type="password"
                name="password"
                id="password"
                placeholder="New Password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={isLoading}
              />
              {formik.touched.password && formik.errors.password && (
                <div className="input-error-text">{formik.errors.password}</div>
              )}

              <input
                required
                className={`reset-password-input ${
                  formik.touched.confirmPassword &&
                  formik.errors.confirmPassword
                    ? "input-error"
                    : ""
                }`}
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                placeholder="Confirm New Password"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={isLoading}
              />
              {formik.touched.confirmPassword &&
                formik.errors.confirmPassword && (
                  <div className="input-error-text">
                    {formik.errors.confirmPassword}
                  </div>
                )}

              <div className="password-requirements">
                <p className="requirements-title">Password must contain:</p>
                <ul>
                  <li
                    className={
                      formik.values.password.length >= 8 ? "valid" : ""
                    }
                  >
                    At least 8 characters
                  </li>
                  <li
                    className={
                      /[a-z]/.test(formik.values.password) ? "valid" : ""
                    }
                  >
                    One lowercase letter
                  </li>
                  <li
                    className={
                      /[A-Z]/.test(formik.values.password) ? "valid" : ""
                    }
                  >
                    One uppercase letter
                  </li>
                  <li
                    className={
                      /[0-9]/.test(formik.values.password) ? "valid" : ""
                    }
                  >
                    One number
                  </li>
                </ul>
              </div>

              <button
                className="reset-password-button"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        ) : (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <p>Password reset successfully!</p>
            <p className="redirect-text">Redirecting to login...</p>
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

export default ResetPasswordPage;
