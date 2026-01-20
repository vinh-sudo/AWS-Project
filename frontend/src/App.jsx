import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/loginPage/LoginPage";
import ForgotPasswordPage from "./pages/forgotPasswordPage/ForgotPasswordPage";
import OtpVerificationPage from "./pages/otpVerificationPage/OtpVerificationPage";
import ResetPasswordPage from "./pages/resetPasswordPage/ResetPasswordPage";
import DraftLayout from "./layouts/DraftLayout";
import AdminPage from "./pages/adminPage/adminUser";
import AdminDashboard from "./pages/adminPage/AdminDashboard";
import AdminApproval from "./pages/adminPage/AdminApproval";
import AuditLog from "./pages/adminPage/AuditLog";
import ManagerDashboard from "./pages/managerPage/ManagerDashboard";
import ManagerOrders from "./pages/managerPage/ManagerOrders";
import ManagerScheduling from "./pages/managerPage/ManagerScheduling";
import ManagerTasks from "./pages/managerPage/ManagerTasks";
import PlannerAssignment from "./pages/plannerPage/PlannerAssignment";
import PlannerScheduling from "./pages/plannerPage/PlannerScheduling";
import LeaderProgress from "./pages/leaderPage/LeaderProgress";
import LeaderTaskAssignment from "./pages/leaderPage/LeaderTaskAssignment";
import WorkerTasks from "./pages/workerPage/WorkerTasks";
import LineManagement from "./pages/linePage/LineManagement";
import Reports from "./pages/reportsPage/Reports";
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
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/approval" element={<AdminApproval />} />
          <Route path="/admin/audit-log" element={<AuditLog />} />
          <Route path="/admin/lines" element={<LineManagement />} />
          {/* Manager Routes */}
          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/manager/dashboard" element={<ManagerDashboard />} />
          <Route path="/manager/tasks" element={<ManagerTasks />} />
          <Route path="/manager/orders" element={<ManagerOrders />} />
          <Route path="/manager/scheduling" element={<ManagerScheduling />} />
          <Route path="/manager/lines" element={<LineManagement />} />
          <Route path="/manager/reports" element={<Reports />} />
          {/* Planner Routes */}
          <Route path="/planner" element={<PlannerAssignment />} />
          <Route path="/planner/assignment" element={<PlannerAssignment />} />
          <Route path="/planner/scheduling" element={<PlannerScheduling />} />
          <Route path="/planner/leaders" element={<PlannerAssignment />} />
          <Route path="/planner/reports" element={<Reports />} />
          <Route path="/planner/lines" element={<LineManagement />} />
          <Route path="/planner/capacity" element={<PlannerScheduling />} />
          {/* Leader Routes */}
          <Route path="/leader" element={<LeaderProgress />} />
          <Route path="/leader/progress" element={<LeaderProgress />} />
          <Route path="/leader/assignment" element={<LeaderTaskAssignment />} />
          <Route path="/leader/workers" element={<LeaderTaskAssignment />} />
          <Route path="/leader/team" element={<LeaderProgress />} />
          <Route path="/leader/history" element={<LeaderProgress />} />
          <Route path="/leader/reports" element={<Reports />} />
          {/* Worker Routes */}
          <Route path="/worker" element={<WorkerTasks />} />
          <Route path="/worker/tasks" element={<WorkerTasks />} />
          <Route path="/worker/history" element={<WorkerTasks />} />
          <Route path="/worker/profile" element={<WorkerTasks />} />
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
