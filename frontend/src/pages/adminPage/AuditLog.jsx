import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import authService from "../../services/authService";
import adminService from "../../services/adminService";
import imsLogo from "../../assets/ims2.jpg";
import dashboardIcon from "../../assets/dashboard.jpg";
import userIcon from "../../assets/user.jpg";
import auditIcon from "../../assets/auditlog.jpg";
import "./adminUser.css";

const AuditLog = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  // Audit logs state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch audit logs on mount (no backend API yet — resolves immediately)
  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      // No backend API available — getAuditLogs returns []
      await adminService.getAuditLogs();
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setError(err.response?.data?.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const dispatch = useDispatch();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-card">
          <img src={imsLogo} alt="Logo" className="loading-logo" />
          <h2 className="loading-title">IMS Admin</h2>
          <div className="loading-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
          <p className="loading-text">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <img src={imsLogo} alt="Logo" className="sidebar-logo" />
          <div className="sidebar-title">IMS Admin</div>
        </div>

        <nav className="sidebar-nav">
          <div
            className="nav-item"
            onClick={() => navigate("/admin/dashboard")}
          >
            <img src={dashboardIcon} alt="Dashboard" className="nav-icon-img" />
            <span>Dashboard</span>
          </div>
          <div className="nav-item" onClick={() => navigate("/admin/approval")}>
            <span className="nav-icon">✅</span>
            <span>Task Approval</span>
          </div>
          <div className="nav-item" onClick={() => navigate("/admin/orders")}>
            <span className="nav-icon">📦</span>
            <span>Order Management</span>
          </div>
          <div className="nav-item" onClick={() => navigate("/admin")}>
            <img src={userIcon} alt="Users" className="nav-icon-img" />
            <span>User Management</span>
          </div>
          <div
            className="nav-item active"
            onClick={() => navigate("/admin/audit-log")}
          >
            <img src={auditIcon} alt="Audit Log" className="nav-icon-img" />
            <span>Audit Log</span>
          </div>
        </nav>

        <div className="logout-item">
          <div className="nav-item logout" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span>Logout</span>
          </div>
        </div>
      </div>

      <div className="admin-main">
        <header className="admin-header">
          <h1 className="header-title">Audit Log</h1>
          <div className="header-actions">
            <NotificationBell />
            <div className="user-menu">
              <div className="user-avatar"></div>
              <span className="user-name">
                {currentUser?.fullName || "Admin"}
              </span>
              <span className="dropdown-icon">▼</span>
            </div>
          </div>
        </header>

        <div className="admin-content">
          <div className="content-header">
            <h2 className="content-title">System Activity Logs</h2>
          </div>

          {/* No backend API available */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 20px",
              textAlign: "center",
              color: "#666",
            }}
          >
            <span style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</span>
            <h3
              style={{ fontSize: "20px", color: "#333", marginBottom: "8px" }}
            >
              Audit Log - Coming Soon
            </h3>
            <p
              style={{ fontSize: "14px", maxWidth: "400px", lineHeight: "1.6" }}
            >
              Tính năng Audit Log đang được phát triển. Hệ thống đã ghi nhận các
              hoạt động nhưng chưa có API để hiển thị.
            </p>
            <button
              className="btn-primary"
              onClick={() => navigate("/admin/dashboard")}
              style={{ marginTop: "24px" }}
            >
              ← Quay về Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
