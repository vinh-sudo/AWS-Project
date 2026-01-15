import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/loginPage/LoginPage";
import ForgotPasswordPage from "./pages/forgotPasswordPage/ForgotPasswordPage";
import OtpVerificationPage from "./pages/otpVerificationPage/OtpVerificationPage";
import ResetPasswordPage from "./pages/resetPasswordPage/ResetPasswordPage";
import DraftLayout from "./layouts/DraftLayout";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DraftLayout />}>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/otp-verification" element={<OtpVerificationPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
