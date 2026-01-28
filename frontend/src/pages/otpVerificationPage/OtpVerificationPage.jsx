import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./OtpVerificationPage.css";
import imsLogo from "../../assets/ims2.jpg";

const OtpVerificationPage = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    // TODO: Replace with real OTP verification logic
    console.log("OTP submitted:", otpValue);
    setIsVerified(true);

    // Navigate to reset password after success
    setTimeout(() => {
      navigate("/reset-password");
    }, 1500);
  };

  const handleResend = () => {
    if (resendTimer === 0) {
      // TODO: Replace with real resend logic
      console.log("Resending OTP...");
      setResendTimer(60);
      setOtp(["", "", "", "", "", ""]);
      setError("");
    }
  };

  return (
    <div className="otp-wrapper">
      <div className="otp-container">
        <div className="otp-heading">Verify OTP</div>

        {!isVerified ? (
          <>
            <p className="otp-description">
              We've sent a 6-digit code to your email. Please enter it below.
            </p>
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
              {error && <div className="input-error-text">{error}</div>}

              <input className="otp-button" type="submit" value="Verify OTP" />
            </form>

            <div className="resend-section">
              {resendTimer > 0 ? (
                <span className="resend-timer">
                  Resend code in {resendTimer}s
                </span>
              ) : (
                <button className="resend-button" onClick={handleResend}>
                  Resend OTP
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <p>OTP verified successfully!</p>
            <p className="redirect-text">Redirecting to reset password...</p>
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
