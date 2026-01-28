import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import "./ManagerSidebar.css";

const ManagerSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const menuItems = [
    { path: "/manager/dashboard", icon: "📊", label: "Dashboard" },
    { path: "/manager/scheduling", icon: "📅", label: "Scheduling" },
    { path: "/manager/production-lines", icon: "🏭", label: "Production Lines" },
    { path: "/manager/progress", icon: "📈", label: "Progress Tracking" },
    { path: "/manager/task-assignment", icon: "✅", label: "Task Assignment" },
    { path: "/manager/reports", icon: "📋", label: "Reports" },
  ];

  return (
    <aside className="manager-sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">IMS</div>
        <span className="logo-text">IMS Manager</span>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <button className="logout-btn" onClick={handleLogout}>
        <span className="nav-icon">🚪</span>
        <span className="nav-label">Logout</span>
      </button>
    </aside>
  );
};

export default ManagerSidebar;
