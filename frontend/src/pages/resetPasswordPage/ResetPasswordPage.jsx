import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import "./ResetPasswordPage.css";
import imsLogo from "../../assets/ims2.jpg";

const ResetPasswordPage = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

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
    onSubmit: (values) => {
      // TODO: Replace with real password reset logic
      console.log("Reset password submit:", values);
      setIsSuccess(true);

      // Navigate to login after success
      setTimeout(() => {
        navigate("/login");
      }, 2000);
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

              <input
                className="reset-password-button"
                type="submit"
                value="Reset Password"
              />
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
