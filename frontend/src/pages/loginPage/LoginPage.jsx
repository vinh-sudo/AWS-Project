import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import "./LoginPage.css";
import imsLogo from "../../assets/ims2.jpg";
import authService from "../../services/authService";

const LoginPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validationSchema = Yup.object({
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setError("");
      setLoading(true);
      try {
        const user = await authService.login(values.email, values.password);
        console.log("Login successful", user);

        // Redirect based on role
        if (user.role === "Admin") {
          navigate("/admin");
        } else if (user.role === "Manager") {
          navigate("/manager/dashboard");
        } else if (user.role === "Leader") {
          navigate("/leader/tasks");
        } else if (user.role === "Worker") {
          navigate("/worker/tasks");
        } else {
          navigate("/dashboard");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-heading">Sign In</div>
        {error && <div className="login-error">{error}</div>}
        <form className="login-form" onSubmit={formik.handleSubmit} noValidate>
          <input
            required
            className={`login-input ${
              formik.touched.email && formik.errors.email ? "input-error" : ""
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
            required
            className={`login-input ${
              formik.touched.password && formik.errors.password
                ? "input-error"
                : ""
            }`}
            type="password"
            name="password"
            id="password"
            placeholder="Password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.password && formik.errors.password && (
            <div className="input-error-text">{formik.errors.password}</div>
          )}
          <span className="forgot-password">
            <Link to="/forgot-password">Forgot Password ?</Link>
          </span>
          <button className="login-button" type="submit" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Mock credentials info for testing */}
        <div className="mock-credentials">
          <p>
            <strong>Test Accounts:</strong>
          </p>
          <p>Admin: admin@ims.com / admin123</p>
          <p>Manager: manager@ims.com / manager123</p>
          <p>Leader: leader@ims.com / leader123</p>
          <p>Worker: worker@ims.com / worker123</p>
        </div>

        <div className="logo-row">
          <img src={imsLogo} alt="IMS Logo" className="logo-item" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
