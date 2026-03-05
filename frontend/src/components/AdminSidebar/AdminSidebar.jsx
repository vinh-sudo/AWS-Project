import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/slices/authSlice";
import authService from "../../services/authService";
import "./AdminSidebar.css";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = authService.getCurrentUser();

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const initials = currentUser?.fullName
    ? currentUser.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "AD";

  return (
    <aside className="as-sidebar">
      {/* Brand / User Info */}
      <div className="as-brand">
        <div className="as-brand-left">
          <div className="as-avatar">{initials}</div>
          <div className="as-brand-info">
            <span className="as-brand-name">
              {currentUser?.fullName || "Admin User"}
            </span>
            <span className="as-brand-role">
              {currentUser?.role?.replace("_", " ") || "ADMIN"}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="as-nav">
        <NavLink
          to="/admin/dashboard"
          end
          className={({ isActive }) =>
            `as-nav-item ${isActive ? "as-active" : ""}`
          }
        >
          <span className="as-nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </span>
          <span className="as-nav-label">Dashboard</span>
        </NavLink>

        <NavLink
          to="/admin/orders"
          className={({ isActive }) =>
            `as-nav-item ${isActive ? "as-active" : ""}`
          }
        >
          <span className="as-nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </span>
          <span className="as-nav-label">Order Management</span>
        </NavLink>

        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            `as-nav-item ${isActive ? "as-active" : ""}`
          }
        >
          <span className="as-nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </span>
          <span className="as-nav-label">User Management</span>
        </NavLink>

        <NavLink
          to="/admin/audit-log"
          className={({ isActive }) =>
            `as-nav-item ${isActive ? "as-active" : ""}`
          }
        >
          <span className="as-nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </span>
          <span className="as-nav-label">Audit Log</span>
        </NavLink>
      </nav>

      {/* Logout */}
      <div className="as-bottom">
        <div className="as-divider" />
        <button className="as-nav-item as-logout" onClick={handleLogout}>
          <span className="as-nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          <span className="as-nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
