import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/slices/authSlice";
import authService from "../../services/authService";
import "./LeaderSidebar.css";

const LeaderSidebar = () => {
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
    : "LD";

  return (
    <aside className="ls-sidebar">
      {/* Brand / User Info */}
      <div className="ls-brand">
        <div className="ls-brand-left">
          <div className="ls-avatar">{initials}</div>
          <div className="ls-brand-info">
            <span className="ls-brand-name">
              {currentUser?.fullName || "Leader"}
            </span>
            <span className="ls-brand-role">Production Leader</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="ls-nav">
        <NavLink
          to="/leader/progress"
          className={({ isActive }) =>
            `ls-nav-item ${isActive ? "ls-active" : ""}`
          }
        >
          <span className="ls-nav-icon">
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
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </span>
          <span className="ls-nav-label">Progress Update</span>
        </NavLink>

        <NavLink
          to="/leader/task-assignment"
          className={({ isActive }) =>
            `ls-nav-item ${isActive ? "ls-active" : ""}`
          }
        >
          <span className="ls-nav-icon">
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
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </span>
          <span className="ls-nav-label">Internal Notes</span>
        </NavLink>
      </nav>

      {/* Logout */}
      <div className="ls-bottom">
        <div className="ls-divider" />
        <button className="ls-nav-item ls-logout" onClick={handleLogout}>
          <span className="ls-nav-icon">
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
          <span className="ls-nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default LeaderSidebar;
