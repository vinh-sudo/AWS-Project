import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import "./LoginPage.css";
import imsLogo from "../../assets/ims2.jpg";

const LoginPage = () => {
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
    onSubmit: (values) => {
      // TODO: replace with real submit logic
      console.log("Login submit", values);
    },
  });

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-heading">Sign In</div>
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
            <a href="#">Forgot Password ?</a>
          </span>
          <input
            className="login-button"
            type="submit"
            defaultValue="Sign In"
          />
        </form>
        <div className="logo-row">
          <img src={imsLogo} alt="IMS Logo" className="logo-item" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
