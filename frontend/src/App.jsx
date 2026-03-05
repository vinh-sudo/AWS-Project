import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectUser } from "./redux";
import LoginPage from "./pages/loginPage/LoginPage";
import ForgotPasswordPage from "./pages/forgotPasswordPage/ForgotPasswordPage";
import OtpVerificationPage from "./pages/otpVerificationPage/OtpVerificationPage";
import ResetPasswordPage from "./pages/resetPasswordPage/ResetPasswordPage";
import DraftLayout from "./layouts/DraftLayout";
// Route guards
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleBasedRoute, { getRoleDefaultPath } from "./routes/RoleBasedRoute";
// Admin imports
import AdminPage from "./pages/adminPage/adminUser";
import AdminDashboard from "./pages/adminPage/AdminDashboard";
import AdminOrders from "./pages/adminPage/AdminOrders";
import AuditLog from "./pages/adminPage/AuditLog";
// Manager imports
import ManagerDashboard from "./pages/managerPage/ManagerDashboard";
import ManagerPlanning from "./pages/managerPage/ManagerPlanning";
import ManagerTracking from "./pages/managerPage/ManagerTracking";
import ManagerLines from "./pages/managerPage/ManagerLines";
import ManagerReports from "./pages/managerPage/ManagerReports";
// Planner imports
import PlannerAssignment from "./pages/plannerPage/PlannerAssignment";
import PlannerScheduling from "./pages/plannerPage/PlannerScheduling";
import PlannerReports from "./pages/plannerPage/PlannerReports";
import LeaderProgress from "./pages/leaderPage/LeaderProgress";
import LeaderTaskAssignment from "./pages/leaderPage/LeaderTaskAssignment";
import Dashboard from "./pages/dashboardPage/Dashboard";
import AICopilot from "./components/AICopilot/AICopilot";
import AuthGuard from "./components/AuthGuard/AuthGuard";
import "./App.css";

/**
 * RedirectIfAuthenticated - Redirects already logged-in users
 * away from public auth pages to their role-based dashboard.
 */
const RedirectIfAuthenticated = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  if (isAuthenticated && user) {
    return <Navigate to={getRoleDefaultPath(user.role)} replace />;
  }

  return children;
};

function App() {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  return (
    <BrowserRouter>
      <AuthGuard />
      <Routes>
        <Route element={<DraftLayout />}>
          {/* Public routes - redirect to dashboard if already authenticated */}
          <Route
            path="/"
            element={
              <RedirectIfAuthenticated>
                <LoginPage />
              </RedirectIfAuthenticated>
            }
          />
          <Route
            path="/login"
            element={
              <RedirectIfAuthenticated>
                <LoginPage />
              </RedirectIfAuthenticated>
            }
          />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/otp-verification" element={<OtpVerificationPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Manager Routes - Quản lý sản xuất: lập kế hoạch, theo dõi tiến độ */}
          <Route
            path="/manager"
            element={
              <RoleBasedRoute allowedRoles={["MANAGER"]}>
                <ManagerDashboard />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/manager/dashboard"
            element={
              <RoleBasedRoute allowedRoles={["MANAGER"]}>
                <ManagerDashboard />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/manager/planning"
            element={
              <RoleBasedRoute allowedRoles={["MANAGER"]}>
                <ManagerPlanning />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/manager/tracking"
            element={
              <RoleBasedRoute allowedRoles={["MANAGER"]}>
                <ManagerTracking />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/manager/lines"
            element={
              <RoleBasedRoute allowedRoles={["MANAGER"]}>
                <ManagerLines />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/manager/reports"
            element={
              <RoleBasedRoute allowedRoles={["MANAGER"]}>
                <ManagerReports />
              </RoleBasedRoute>
            }
          />

          {/* Admin Routes - Quản lý user, đơn hàng, duyệt, audit */}
          <Route
            path="/admin"
            element={
              <RoleBasedRoute allowedRoles={["ADMIN"]}>
                <AdminPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RoleBasedRoute allowedRoles={["ADMIN"]}>
                <AdminPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <RoleBasedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <RoleBasedRoute allowedRoles={["ADMIN"]}>
                <AdminOrders />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/audit-log"
            element={
              <RoleBasedRoute allowedRoles={["ADMIN"]}>
                <AuditLog />
              </RoleBasedRoute>
            }
          />

          {/* Planner Routes */}
          <Route
            path="/planner"
            element={
              <RoleBasedRoute allowedRoles={["PRODUCTION_PLANNER"]}>
                <PlannerAssignment />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/planner/assignment"
            element={
              <RoleBasedRoute allowedRoles={["PRODUCTION_PLANNER"]}>
                <PlannerAssignment />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/planner/scheduling"
            element={
              <RoleBasedRoute allowedRoles={["PRODUCTION_PLANNER"]}>
                <PlannerScheduling />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/planner/reports"
            element={
              <RoleBasedRoute allowedRoles={["PRODUCTION_PLANNER"]}>
                <PlannerReports />
              </RoleBasedRoute>
            }
          />

          {/* Leader Routes */}
          <Route
            path="/leader"
            element={
              <RoleBasedRoute allowedRoles={["LINE_LEADER"]}>
                <LeaderProgress />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/leader/progress"
            element={
              <RoleBasedRoute allowedRoles={["LINE_LEADER"]}>
                <LeaderProgress />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/leader/task-assignment"
            element={
              <RoleBasedRoute allowedRoles={["LINE_LEADER"]}>
                <LeaderTaskAssignment />
              </RoleBasedRoute>
            }
          />

          {/* Reports & Dashboard Routes - accessible by all authenticated users */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <PlannerReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
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
