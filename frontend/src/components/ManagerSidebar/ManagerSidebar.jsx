import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux";
import authService from "../../services/authService";
import "./ManagerSidebar.css";

const ManagerSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = authService.getCurrentUser();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  const initials = currentUser?.fullName
    ? currentUser.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "IM";

  const menuItems = [
    {
      path: "/manager/dashboard",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
      label: "Dashboard",
    },
    {
      path: "/manager/planning",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 14l2 2 4-4" />
        </svg>
      ),
      label: "Planning",
    },
    {
      path: "/manager/tracking",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      label: "Progress Tracking",
    },
    {
      path: "/manager/lines",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 20h20" />
          <path d="M5 20V10l4-6h6l4 6v10" />
          <path d="M9 20v-4h6v4" />
        </svg>
      ),
      label: "Line Management",
    },
  ];

  return (
    <aside className={`ms-sidebar ${collapsed ? "ms-collapsed" : ""}`}>
      {/* Brand + Toggle */}
      <div className="ms-brand">
        <div className="ms-brand-left">
          <div className="ms-avatar">{initials}</div>
          <div className="ms-brand-info">
            <span className="ms-brand-name">
              {currentUser?.fullName || "IMS Manager"}
            </span>
            <span className="ms-brand-role">Production Manager</span>
          </div>
        </div>
        <button
          className="ms-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand" : "Collapse"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? (
              <polyline points="9 6 15 12 9 18" />
            ) : (
              <polyline points="15 6 9 12 15 18" />
            )}
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="ms-search">
        <svg className="ms-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" placeholder="Search..." className="ms-search-input" />
      </div>

      {/* Menu */}
      <nav className="ms-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/manager/dashboard"}
            className={({ isActive }) =>
              `ms-nav-item ${isActive ? "ms-active" : ""}`
            }
            data-tooltip={item.label}
          >
            <span className="ms-nav-icon">{item.icon}</span>
            <span className="ms-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Divider + Logout */}
      <div className="ms-bottom">
        <div className="ms-divider" />
        <button
          className="ms-nav-item ms-logout"
          onClick={handleLogout}
          data-tooltip="Logout"
        >
          <span className="ms-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          <span className="ms-nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default ManagerSidebar;
