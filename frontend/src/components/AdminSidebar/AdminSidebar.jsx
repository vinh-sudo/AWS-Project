import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authService from "../../services/authService";
import imsLogo from "../../assets/ims2.jpg";
import "./AdminSidebar.css";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  // Check if current path matches the nav item
  const isActive = (path) => {
    if (path === "/admin" && location.pathname === "/admin") {
      return true;
    }
    if (path !== "/admin" && location.pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  const menuItems = [
    { path: "/admin/dashboard", icon: "📊", label: "Dashboard" },
    { path: "/admin/approval", icon: "✅", label: "Task Approval" },
    { path: "/admin", icon: "👥", label: "User Management", exact: true },
    { path: "/admin/lines", icon: "🏭", label: "Line Management" },
    { path: "/admin/audit-log", icon: "📝", label: "Audit Log" },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <img src={imsLogo} alt="IMS Logo" className="sidebar-logo" />
        <span className="sidebar-title">IMS Admin</span>
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

export default AdminSidebar;
