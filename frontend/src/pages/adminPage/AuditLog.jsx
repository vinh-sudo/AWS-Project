import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("All actions");
  const [entityFilter, setEntityFilter] = useState("All entities");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Fetch audit logs on mount
  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getAuditLogs();
      setAuditLogs(data);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setError(err.response?.data?.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const getActionClass = (action) => {
    switch (action) {
      case "CREATE":
        return "action-create";
      case "UPDATE":
        return "action-update";
      case "DELETE":
        return "action-delete";
      case "LOGIN":
        return "action-login";
      case "LOGOUT":
        return "action-logout";
      default:
        return "";
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleString("vi-VN");
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      (log.userEmail?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (log.userName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (log.details?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (log.entity?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesAction =
      actionFilter === "All actions" || log.actionType === actionFilter;
    const matchesEntity =
      entityFilter === "All entities" || log.entity === entityFilter;

    // Date filtering
    let matchesDate = true;
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      const logDate = new Date(log.timestamp);
      matchesDate = matchesDate && logDate >= fromDate;
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      const logDate = new Date(log.timestamp);
      matchesDate = matchesDate && logDate <= toDate;
    }

    return matchesSearch && matchesAction && matchesEntity && matchesDate;
  });

  const uniqueEntities = [
    ...new Set(auditLogs.map((log) => log.entity).filter(Boolean)),
  ];

  if (loading) {
    return (
      <div className="admin-container">
        <div
          className="loading-container"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
          }}
        >
          <div
            className="loading-spinner"
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3498db",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          ></div>
          <p>Loading audit logs...</p>
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
            <button
              className="header-icon-btn"
              onClick={fetchAuditLogs}
              title="Refresh"
            >
              🔄
            </button>
            <button className="header-icon-btn">🔔</button>
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
          {error && (
            <div
              className="error-banner"
              style={{
                background: "#ffebee",
                color: "#c62828",
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>⚠️ {error}</span>
              <button
                onClick={fetchAuditLogs}
                style={{
                  background: "#c62828",
                  color: "white",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          )}

          <div className="content-header">
            <h2 className="content-title">System Activity Logs</h2>
            <button className="btn-primary" onClick={() => window.print()}>
              📥 Export Logs
            </button>
          </div>

          {/* Filters */}
          <div className="audit-filters">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by user, action or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Action</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="filter-select"
              >
                <option>All actions</option>
                <option>CREATE</option>
                <option>UPDATE</option>
                <option>DELETE</option>
                <option>LOGIN</option>
                <option>LOGOUT</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Entity</label>
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="filter-select"
              >
                <option>All entities</option>
                {uniqueEntities.map((entity) => (
                  <option key={entity}>{entity}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="filter-date"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="filter-date"
              />
            </div>
          </div>

          {/* Audit Log Table */}
          <div className="audit-table-container">
            <table className="audit-table">
              <thead>
                <tr>
                  <th className="table-header">ID</th>
                  <th className="table-header">Timestamp</th>
                  <th className="table-header">User</th>
                  <th className="table-header">Action</th>
                  <th className="table-header">Entity</th>
                  <th className="table-header">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        textAlign: "center",
                        padding: "40px",
                        color: "#666",
                      }}
                    >
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="table-row">
                      <td className="table-cell">{log.id}</td>
                      <td className="table-cell timestamp-cell">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="table-cell">
                        <div className="user-cell">
                          <div className="user-avatar-small">
                            {(log.userEmail || log.userName || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <span>{log.userEmail || log.userName || "-"}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span
                          className={`action-badge ${getActionClass(log.actionType)}`}
                        >
                          {log.actionType}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="entity-badge">{log.entity}</span>
                      </td>
                      <td className="table-cell details-cell">{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <span className="pagination-info">
              Showing {filteredLogs.length} of {auditLogs.length} entries
            </span>
            <div className="pagination-controls">
              <button className="pagination-btn" disabled>
                ← Previous
              </button>
              <button className="pagination-btn active">1</button>
              <button className="pagination-btn">2</button>
              <button className="pagination-btn">3</button>
              <button className="pagination-btn">Next →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
