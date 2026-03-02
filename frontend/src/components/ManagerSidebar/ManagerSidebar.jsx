import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux";
import authService from "../../services/authService";
import "./ManagerSidebar.css";

const ManagerSidebar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = authService.getCurrentUser();

  const handleLogout = async () => {
    await dispatch(logout());
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
      label: "Planning",
    },
    {
      path: "/manager/tracking",
      icon: "📈",
      label: "Progress Tracking",
    },
    {
      path: "/manager/lines",
      icon: "🏭",
      label: "Line Management",
    },
    {
      path: "/manager/reports",
      icon: "📈",
      label: "Reports",
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
          <span className="nav-section-title">MAIN MENU</span>
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
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default ManagerSidebar;
