import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import "./ManagerSidebar.css";

const ManagerSidebar = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const menuItems = [
    {
      path: "/manager/dashboard",
      icon: "📊",
      label: "Dashboard",
    },
    {
      path: "/manager/planning",
      icon: "📋",
      label: "Lập kế hoạch",
    },
    {
      path: "/manager/tracking",
      icon: "📈",
      label: "Theo dõi tiến độ",
    },
    {
      path: "/manager/lines",
      icon: "🏭",
      label: "Quản lý Line",
    },
  ];

  return (
    <div className="manager-sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <span className="logo-icon">🏭</span>
          <span className="logo-text">IMS Manager</span>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">
          {currentUser?.fullName?.charAt(0) || "M"}
        </div>
        <div className="user-info">
          <span className="user-name">
            {currentUser?.fullName || "Manager"}
          </span>
          <span className="user-role">Production Manager</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <span className="nav-section-title">MENU CHÍNH</span>
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
        </div>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <span className="nav-icon">🚪</span>
          <span className="nav-label">Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

export default ManagerSidebar;
