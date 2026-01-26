import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/loginPage/LoginPage";
import ForgotPasswordPage from "./pages/forgotPasswordPage/ForgotPasswordPage";
import OtpVerificationPage from "./pages/otpVerificationPage/OtpVerificationPage";
import ResetPasswordPage from "./pages/resetPasswordPage/ResetPasswordPage";
import DraftLayout from "./layouts/DraftLayout";
// Admin imports
import AdminPage from "./pages/adminPage/adminUser";
import AdminDashboard from "./pages/adminPage/AdminDashboard";
import AdminApproval from "./pages/adminPage/AdminApproval";
import AdminOrders from "./pages/adminPage/AdminOrders";
import AuditLog from "./pages/adminPage/AuditLog";
// Director imports
import DirectorDashboard from "./pages/directorPage/DirectorDashboard";
// Manager imports - Gộp chung tất cả chức năng planner, leader, line vào manager
import ManagerDashboard from "./pages/managerPage/ManagerDashboard";
import ManagerOrders from "./pages/managerPage/ManagerOrders";
import ManagerScheduling from "./pages/managerPage/ManagerScheduling";
import ManagerTasks from "./pages/managerPage/ManagerTasks";
import PlannerAssignment from "./pages/plannerPage/PlannerAssignment";
import PlannerScheduling from "./pages/plannerPage/PlannerScheduling";
import PlannerReports from "./pages/plannerPage/PlannerReports";
import LeaderProgress from "./pages/leaderPage/LeaderProgress";
import LeaderTaskAssignment from "./pages/leaderPage/LeaderTaskAssignment";


// Shared imports
import Reports from "./pages/managerPage/Reports";
import Dashboard from "./pages/dashboardPage/Dashboard";
import AICopilot from "./components/AICopilot/AICopilot";
import "./App.css";

function App() {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DraftLayout />}>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/otp-verification" element={<OtpVerificationPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Director Routes - Cấp cao nhất: ra chỉ đạo, xem tổng quan */}
          <Route path="/director" element={<DirectorDashboard />} />
          <Route path="/director/dashboard" element={<DirectorDashboard />} />

          {/* Admin Routes - Quản lý user, đơn hàng, duyệt, audit */}
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/approval" element={<AdminApproval />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/audit-log" element={<AuditLog />} />

          {/* Manager Routes - Gộp chung tất cả chức năng quản lý */}
          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/manager/tasks" element={<ManagerTasks />} />
          <Route path="/manager/orders" element={<ManagerOrders />} />
          <Route path="/manager/scheduling" element={<ManagerScheduling />} />
          <Route
            path="/manager/planner-scheduling"
            element={<PlannerScheduling />}
          />
          <Route path="/manager/assignment" element={<PlannerAssignment />} />
          
          <Route path="/manager/progress" element={<LeaderProgress />} />
          <Route
            path="/manager/task-assignment"
            element={<LeaderTaskAssignment />}
          />
          <Route path="/manager/reports" element={<Reports />} />

          {/* Planner Routes */}
          <Route path="/planner" element={<PlannerAssignment />} />
          <Route path="/planner/assignment" element={<PlannerAssignment />} />
          <Route path="/planner/scheduling" element={<PlannerScheduling />} />
          <Route path="/planner/reports" element={<PlannerReports />} />

          {/* Leader Routes */}
          <Route path="/leader" element={<LeaderProgress />} />
          <Route path="/leader/progress" element={<LeaderProgress />} />
          <Route
            path="/leader/task-assignment"
            element={<LeaderTaskAssignment />}
          />

          {/* Reports & Dashboard Routes */}
          <Route path="/reports" element={<Reports />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>

      {/* AI Copilot Floating Button */}
      <button
        className={`copilot-fab ${isCopilotOpen ? "hidden" : ""}`}
        onClick={() => setIsCopilotOpen(true)}
        title="AI Production Copilot"
      >
        🤖
      </button>

      {/* AI Copilot Panel */}
      <AICopilot
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />
    </BrowserRouter>
  );
}

export default App;
