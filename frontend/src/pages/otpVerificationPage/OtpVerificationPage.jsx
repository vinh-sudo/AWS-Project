import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./OtpVerificationPage.css";
import imsLogo from "../../assets/ims2.jpg";
import authService from "../../services/authService";

const OtpVerificationPage = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Get employeeCode from navigation state
  const employeeCode = location.state?.employeeCode;
  const normalizedEmployeeCode =
    typeof employeeCode === "string" ? employeeCode.trim() : "";

  // Redirect if no employeeCode
  useEffect(() => {
    if (!normalizedEmployeeCode) {
      navigate("/forgot-password");
    }
  }, [normalizedEmployeeCode, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);
  };

  const validatePassword = (value) => {
    if (value.length < 8) return "Password must be at least 8 characters";
    if (!/[a-z]/.test(value))
      return "Password must contain at least one lowercase letter";
    if (!/[A-Z]/.test(value))
      return "Password must contain at least one uppercase letter";
    if (!/[0-9]/.test(value))
      return "Password must contain at least one number";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords must match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await authService.verifyOtpAndResetPassword(
        normalizedEmployeeCode,
        otpValue,
        password,
      );

      setIsVerified(true);

      setTimeout(() => {
        navigate("/login");
      }, 1600);
    } catch (err) {
      setError(err.message || "Invalid or expired OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer === 0 && normalizedEmployeeCode) {
      setIsLoading(true);
      setError("");

      try {
        await authService.resendOtp(normalizedEmployeeCode);
        setResendTimer(60);
        setOtp(["", "", "", "", "", ""]);
        setPassword("");
        setConfirmPassword("");
      } catch (err) {
        setError(err.message || "Failed to resend OTP");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="otp-wrapper">
      <div className="otp-container">
        <div className="otp-heading">Verify OTP</div>

        {!isVerified ? (
          <>
            <p className="otp-description">
              Enter your 6-digit OTP and set a new password to complete reset.
            </p>
            {error && <div className="error-message">{error}</div>}
            <form className="otp-form" onSubmit={handleSubmit}>
              <div className="otp-inputs" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={`otp-input ${error ? "input-error" : ""}`}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                  />
                ))}
              </div>

              <div className="otp-password-group">
                <input
                  className="otp-password-input"
                  type="password"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <input
                  className="otp-password-input"
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
                <p className="otp-password-hint">
                  Password requires at least 8 characters with uppercase,
                  lowercase, and number.
                </p>
              </div>

              <button className="otp-button" type="submit" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify OTP & Reset Password"}
              </button>
            </form>

            <div className="resend-section">
              {resendTimer > 0 ? (
                <span className="resend-timer">
                  Resend code in {resendTimer}s
                </span>
              ) : (
                <button
                  className="resend-button"
                  onClick={handleResend}
                  disabled={isLoading}
                >
                  Resend OTP
                </button>
              )}
            </div>
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

export default OtpVerificationPage;
