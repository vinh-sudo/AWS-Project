import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authService from "../../services/authService";
import imsLogo from "../../assets/ims2.jpg";
import "./ManagerSidebar.css";

const ManagerSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  // Check if current path matches the nav item
  const isActive = (path) => {
    if (path === "/manager" && location.pathname === "/manager") {
      return true;
    }
    if (path !== "/manager" && location.pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  const menuItems = [
    { path: "/manager", icon: "📊", label: "Dashboard", exact: true },
    { path: "/manager/orders", icon: "📦", label: "Orders" },
    { path: "/manager/tasks", icon: "📋", label: "Tasks" },
    { path: "/manager/scheduling", icon: "📅", label: "Scheduling" },
    { path: "/manager/planner-scheduling", icon: "🗓️", label: "Planner Scheduling" },
    { path: "/manager/assignment", icon: "👤", label: "Assignment" },
    { path: "/manager/lines", icon: "🏭", label: "Production Lines" },
    { path: "/manager/progress", icon: "📈", label: "Progress Tracking" },
    { path: "/manager/task-assignment", icon: "✅", label: "Task Assignment" },
    { path: "/manager/reports", icon: "📊", label: "Reports" },
  ];

  return (
    <aside className="manager-sidebar">
      <div className="sidebar-header">
        <img src={imsLogo} alt="IMS Logo" className="sidebar-logo" />
        <span className="sidebar-title">IMS Manager</span>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <div
            key={item.path}
            className={`nav-item ${
              item.exact
                ? location.pathname === item.path
                  ? "active"
                  : ""
                : isActive(item.path)
                  ? "active"
                  : ""
            }`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="nav-item logout" onClick={handleLogout}>
          <span className="nav-icon">🚪</span>
          <span>Logout</span>
        </div>
      </div>
    </aside>
  );
};

export default ManagerSidebar;
