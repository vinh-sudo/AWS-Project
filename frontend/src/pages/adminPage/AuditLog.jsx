import React from "react";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import AdminSidebar from "../../components/AdminSidebar/AdminSidebar";
import authService from "../../services/authService";
import "./adminUser.css";

const AuditLog = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  return (
    <div className="admin-container">
      <AdminSidebar />

      <div className="admin-main">
        <header className="dash-header">
          <div className="dash-header-left">
            <div className="dash-header-avatar">
              {(currentUser?.fullName || "A").charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="dash-title">Audit Log</h1>
              <p className="dash-subtitle">System activity logs and history</p>
            </div>
          </div>
          <div className="dash-header-right">
            <NotificationBell />
          </div>
        </header>

        <div className="admin-content">
          <div className="content-header">
            <h2 className="content-title">System Activity Logs</h2>
          </div>

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
              The Audit Log feature is under development. The system has been
              recording activities but there is no API to display them yet.
            </p>
            <button
              className="btn-primary"
              onClick={() => navigate("/admin/dashboard")}
              style={{ marginTop: "24px" }}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
