import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/loginPage/LoginPage";
import ForgotPasswordPage from "./pages/forgotPasswordPage/ForgotPasswordPage";
import OtpVerificationPage from "./pages/otpVerificationPage/OtpVerificationPage";
import ResetPasswordPage from "./pages/resetPasswordPage/ResetPasswordPage";
import DraftLayout from "./layouts/DraftLayout";
import AdminPage from "./pages/adminPage/adminUser";
import AdminDashboard from "./pages/adminPage/AdminDashboard";
import AuditLog from "./pages/adminPage/AuditLog";
import ManagerDashboard from "./pages/managerPage/ManagerDashboard";
import ManagerOrders from "./pages/managerPage/ManagerOrders";
import ManagerScheduling from "./pages/managerPage/ManagerScheduling";
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
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/audit-log" element={<AuditLog />} />
          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/manager/dashboard" element={<ManagerDashboard />} />
          <Route path="/manager/orders" element={<ManagerOrders />} />
          <Route path="/manager/scheduling" element={<ManagerScheduling />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
