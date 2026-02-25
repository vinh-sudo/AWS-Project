import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import "./LoginPage.css";
import imsLogo from "../../assets/ims2.jpg";
import { login, clearError, selectIsLoading, selectError } from "../../redux";

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  const validationSchema = Yup.object({
    employeeCode: Yup.string().required("Employee Code is required"),
    password: Yup.string()
      .min(4, "Password must be at least 4 characters")
      .required("Password is required"),
  });

  // Clear error on component mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const formik = useFormik({
    initialValues: {
      employeeCode: "",
      password: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      const result = await dispatch(
        login({ employeeCode: values.employeeCode, password: values.password }),
      );

      if (login.fulfilled.match(result)) {
        const user = result.payload;
        console.log("Login successful", user);

        // Redirect based on role (matches backend Role enum: ADMIN, MANAGER, LINE_LEADER, PRODUCTION_PLANNER)
        const role = user.role?.toUpperCase();
        switch (role) {
          case "ADMIN":
            navigate("/admin/approval");
            break;
          case "MANAGER":
            navigate("/manager/dashboard");
            break;
          case "PRODUCTION_PLANNER":
            navigate("/planner/assignment");
            break;
          case "LINE_LEADER":
            navigate("/leader/progress");
            break;
          default:
            navigate("/dashboard");
        }
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
            <div className="input-error-text">{formik.errors.employeeCode}</div>
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
          <button className="login-button" type="submit" disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="logo-row">
          <img src={imsLogo} alt="IMS Logo" className="logo-item" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
