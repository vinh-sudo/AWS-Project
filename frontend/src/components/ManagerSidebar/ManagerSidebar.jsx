import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/slices/authSlice";
import authService from "../../services/authService";
import "./ManagerSidebar.css";

const ManagerSidebar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = authService.getCurrentUser();

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
    } catch (error) {
      console.error("Logout failed:", error);
    }
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

  return (
    <aside className="ms-sidebar">
      {/* Brand */}
      <div className="ms-brand">
        <div className="ms-brand-left">
          <div className="ms-avatar">{initials}</div>
          <div className="ms-brand-info">
            <span className="ms-brand-name">
              {currentUser?.fullName || "IMS Manager"}
            </span>
            <span className="ms-brand-role">
              {currentUser?.role || "Production Manager"}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="ms-nav">
        <NavLink
          to="/manager/dashboard"
          end
          className={({ isActive }) =>
            `ms-nav-item ${isActive ? "ms-active" : ""}`
          }
        >
          <span className="ms-nav-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </span>
          <span className="ms-nav-label">Dashboard</span>
        </NavLink>

        <NavLink
          to="/manager/planning"
          className={({ isActive }) =>
            `ms-nav-item ${isActive ? "ms-active" : ""}`
          }
        >
          <span className="ms-nav-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </span>
          <span className="ms-nav-label">Planning</span>
        </NavLink>

        <NavLink
          to="/manager/tracking"
          className={({ isActive }) =>
            `ms-nav-item ${isActive ? "ms-active" : ""}`
          }
        >
          <span className="ms-nav-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </span>
          <span className="ms-nav-label">Progress Tracking</span>
        </NavLink>

        <NavLink
          to="/manager/lines"
          className={({ isActive }) =>
            `ms-nav-item ${isActive ? "ms-active" : ""}`
          }
        >
          <span className="ms-nav-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 20h.01" />
              <path d="M7 20v-4" />
              <path d="M12 20v-8" />
              <path d="M17 20V8" />
              <path d="M22 4v16" />
            </svg>
          </span>
          <span className="ms-nav-label">Line Management</span>
        </NavLink>

        <NavLink
          to="/manager/orders"
          className={({ isActive }) =>
            `ms-nav-item ${isActive ? "ms-active" : ""}`
          }
        >
          <span className="ms-nav-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </span>
          <span className="ms-nav-label">Orders</span>
        </NavLink>
      </nav>

      {/* Logout */}
      <div className="ms-bottom">
        <div className="ms-divider" />
        <button className="ms-nav-item ms-logout" onClick={handleLogout}>
          <span className="ms-nav-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
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
