import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import imsLogo from "../../assets/ims2.jpg";
import dashboardIcon from "../../assets/dashboard.jpg";
import userIcon from "../../assets/user.jpg";
import auditIcon from "../../assets/auditlog.jpg";
import "./adminUser.css";

const AuditLog = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  // Mock data for audit logs based on database schema
  const [auditLogs] = useState([
    {
      log_id: 1,
      user_id: 1,
      user_email: "admin@ims.com",
      action_type: "CREATE",
      entity: "users",
      details: "Created new user: binh.tt@y.com with role Sales",
      timestamp: "2026-01-16 10:30:45",
    },
    {
      log_id: 2,
      user_id: 1,
      user_email: "admin@ims.com",
      action_type: "UPDATE",
      entity: "users",
      details: "Updated user status: planner1@z.com changed to Blocked",
      timestamp: "2026-01-16 09:15:22",
    },
    {
      log_id: 3,
      user_id: 2,
      user_email: "planner@ims.com",
      action_type: "UPDATE",
      entity: "orders",
      details: "Updated order #1234 status from Draft to Approved",
      timestamp: "2026-01-16 08:45:10",
    },
    {
      log_id: 4,
      user_id: 3,
      user_email: "planner@ims.com",
      action_type: "CREATE",
      entity: "production_schedule",
      details: "Created production schedule for Order #1234 on Line A",
      timestamp: "2026-01-15 16:20:33",
    },
    {
      log_id: 5,
      user_id: 4,
      user_email: "sales@ims.com",
      action_type: "CREATE",
      entity: "orders",
      details: "Created new order #1235 for Customer ABC Corp, 500 units",
      timestamp: "2026-01-15 14:55:18",
    },
    {
      log_id: 6,
      user_id: 1,
      user_email: "admin@ims.com",
      action_type: "DELETE",
      entity: "users",
      details: "Deleted user: test.user@ims.com",
      timestamp: "2026-01-15 11:30:00",
    },
    {
      log_id: 7,
      user_id: 2,
      user_email: "planner@ims.com",
      action_type: "UPDATE",
      entity: "production_line",
      details: "Updated Line C status to Maintenance",
      timestamp: "2026-01-15 10:00:45",
    },
    {
      log_id: 8,
      user_id: 1,
      user_email: "admin@ims.com",
      action_type: "LOGIN",
      entity: "accounts",
      details: "User logged in from IP: 192.168.1.100",
      timestamp: "2026-01-15 08:00:12",
    },
    {
      log_id: 9,
      user_id: 3,
      user_email: "planner@ims.com",
      action_type: "UPDATE",
      entity: "machine",
      details: "Updated Machine M-001 last maintenance date",
      timestamp: "2026-01-14 17:45:30",
    },
    {
      log_id: 10,
      user_id: 4,
      user_email: "sales@ims.com",
      action_type: "CREATE",
      entity: "order_items",
      details: "Added 3 items to Order #1230",
      timestamp: "2026-01-14 15:20:00",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("All actions");
  const [entityFilter, setEntityFilter] = useState("All entities");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction =
      actionFilter === "All actions" || log.action_type === actionFilter;
    const matchesEntity =
      entityFilter === "All entities" || log.entity === entityFilter;
    return matchesSearch && matchesAction && matchesEntity;
  });

  const uniqueEntities = [...new Set(auditLogs.map((log) => log.entity))];

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
                {filteredLogs.map((log) => (
                  <tr key={log.log_id} className="table-row">
                    <td className="table-cell">{log.log_id}</td>
                    <td className="table-cell timestamp-cell">
                      {log.timestamp}
                    </td>
                    <td className="table-cell">
                      <div className="user-cell">
                        <div className="user-avatar-small">
                          {log.user_email.charAt(0).toUpperCase()}
                        </div>
                        <span>{log.user_email}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span
                        className={`action-badge ${getActionClass(
                          log.action_type
                        )}`}
                      >
                        {log.action_type}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="entity-badge">{log.entity}</span>
                    </td>
                    <td className="table-cell details-cell">{log.details}</td>
                  </tr>
                ))}
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
