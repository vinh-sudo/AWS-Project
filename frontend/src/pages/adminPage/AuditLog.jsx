import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import AdminSidebar from "../../components/AdminSidebar/AdminSidebar";
import authService from "../../services/authService";
import adminService from "../../services/adminService";
import "./adminUser.css";

const AuditLog = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      await adminService.getAuditLogs();
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setError(err.response?.data?.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-card">
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
            <h3 style={{ fontSize: "20px", color: "#333", marginBottom: "8px" }}>
              Audit Log - Coming Soon
            </h3>
            <p style={{ fontSize: "14px", maxWidth: "400px", lineHeight: "1.6" }}>
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
