import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import authService from "../../services/authService";
import imsLogo from "../../assets/ims2.jpg";
import dashboardIcon from "../../assets/dashboard.jpg";
import userIcon from "../../assets/user.jpg";
import auditIcon from "../../assets/auditlog.jpg";
import "./adminUser.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);

  // Mock data for dashboard statistics
  const [stats] = useState({
    totalUsers: 156,
    activeUsers: 142,
    blockedUsers: 14,
    totalOrders: 1234,
    pendingOrders: 45,
    completedOrders: 1150,
    inProgressOrders: 39,
    totalProductionLines: 8,
    activeLines: 6,
    totalMachines: 32,
    activeMachines: 28,
    avgEfficiency: 87.5,
    todayOutput: 2450,
    monthlyOutput: 52000,
  });

  // Mock data for recent activities
  const [recentActivities] = useState([
    {
      id: 1,
      user: "admin@ims.com",
      action: "Created new user",
      entity: "users",
      time: "5 minutes ago",
    },
    {
      id: 2,
      user: "planner@ims.com",
      action: "Updated production schedule",
      entity: "production_schedule",
      time: "15 minutes ago",
    },
    {
      id: 3,
      user: "manager@ims.com",
      action: "Approved order #1234",
      entity: "orders",
      time: "1 hour ago",
    },
    {
      id: 4,
      user: "admin@ims.com",
      action: "Blocked user binh.tt",
      entity: "users",
      time: "2 hours ago",
    },
    {
      id: 5,
      user: "sales@ims.com",
      action: "Created new order",
      entity: "orders",
      time: "3 hours ago",
    },
  ]);

  // Mock data for production line status
  const [productionLines] = useState([
    { id: 1, name: "Line A", status: "Running", efficiency: 92, output: 450 },
    { id: 2, name: "Line B", status: "Running", efficiency: 88, output: 420 },
    { id: 3, name: "Line C", status: "Maintenance", efficiency: 0, output: 0 },
    { id: 4, name: "Line D", status: "Running", efficiency: 85, output: 380 },
    { id: 5, name: "Line E", status: "Running", efficiency: 90, output: 440 },
    { id: 6, name: "Line F", status: "Idle", efficiency: 0, output: 0 },
  ]);

  // Data for Pie Chart (Production Line Status)
  const pieChartData = [
    {
      name: "Running",
      value: productionLines.filter((l) => l.status === "Running").length,
      color: "#4CAF50",
    },
    {
      name: "Maintenance",
      value: productionLines.filter((l) => l.status === "Maintenance").length,
      color: "#FF9800",
    },
    {
      name: "Idle",
      value: productionLines.filter((l) => l.status === "Idle").length,
      color: "#9E9E9E",
    },
  ];

  // Data for Bar Chart (Activities by Entity)
  const activityByEntity = recentActivities.reduce((acc, activity) => {
    acc[activity.entity] = (acc[activity.entity] || 0) + 1;
    return acc;
  }, {});

  const barChartData = Object.keys(activityByEntity).map((entity) => ({
    entity: entity,
    count: activityByEntity[entity],
  }));

  const COLORS = ["#5ec8c4", "#f195b3", "#9E9E9E"];

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Running":
        return "status-running";
      case "Maintenance":
        return "status-maintenance";
      case "Idle":
        return "status-idle";
      default:
        return "";
    }
  };

  // Handle click on pie chart slice
  const handlePieClick = (data) => {
    setSelectedStatus(data.name);
    setShowProductionModal(true);
  };

  // Get filtered production lines based on selected status
  const getFilteredProductionLines = () => {
    if (!selectedStatus) return productionLines;
    return productionLines.filter((line) => line.status === selectedStatus);
  };

  // Close modal and reset selected status
  const closeProductionModal = () => {
    setShowProductionModal(false);
    setSelectedStatus(null);
  };

  return (
    <div className="admin-container">
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <img src={imsLogo} alt="Logo" className="sidebar-logo" />
          <div className="sidebar-title">IMS Admin</div>
        </div>

        <nav className="sidebar-nav">
          <div
            className="nav-item active"
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
            className="nav-item"
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
          <h1 className="header-title">Dashboard</h1>
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

        <div className="admin-content dashboard-content">
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card stat-users">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalUsers}</div>
                <div className="stat-label">Total Users</div>
                <div className="stat-detail">
                  <span className="stat-active">
                    {stats.activeUsers} Active
                  </span>
                  <span className="stat-blocked">
                    {stats.blockedUsers} Blocked
                  </span>
                </div>
              </div>
            </div>

            <div className="stat-card stat-orders">
              <div className="stat-icon">📦</div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalOrders}</div>
                <div className="stat-label">Total Orders</div>
                <div className="stat-detail">
                  <span className="stat-pending">
                    {stats.pendingOrders} Pending
                  </span>
                  <span className="stat-progress">
                    {stats.inProgressOrders} In Progress
                  </span>
                </div>
              </div>
            </div>

            <div className="stat-card stat-production">
              <div className="stat-icon">🏭</div>
              <div className="stat-info">
                <div className="stat-value">
                  {stats.activeLines}/{stats.totalProductionLines}
                </div>
                <div className="stat-label">Production Lines</div>
                <div className="stat-detail">
                  <span className="stat-machines">
                    {stats.activeMachines} Machines Active
                  </span>
                </div>
              </div>
            </div>

            <div className="stat-card stat-efficiency">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <div className="stat-value">{stats.avgEfficiency}%</div>
                <div className="stat-label">Avg Efficiency</div>
                <div className="stat-detail">
                  <span className="stat-output">
                    {stats.todayOutput} units today
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Content - Charts */}
          <div className="dashboard-grid">
            {/* Production Line Status - Pie Chart */}
            <div className="dashboard-card chart-card">
              <div className="card-header">
                <h3 className="card-title">Production Line Status</h3>
                <span className="click-hint">Click on chart to filter</span>
              </div>
              <div className="card-body chart-container">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      onClick={handlePieClick}
                      style={{ cursor: "pointer" }}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          style={{ cursor: "pointer" }}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-legend-custom">
                  <div
                    className="legend-item clickable"
                    onClick={() => handlePieClick({ name: "Running" })}
                  >
                    <span
                      className="legend-color"
                      style={{ background: "#4CAF50" }}
                    ></span>
                    <span>Running ({pieChartData[0].value})</span>
                  </div>
                  <div
                    className="legend-item clickable"
                    onClick={() => handlePieClick({ name: "Maintenance" })}
                  >
                    <span
                      className="legend-color"
                      style={{ background: "#FF9800" }}
                    ></span>
                    <span>Maintenance ({pieChartData[1].value})</span>
                  </div>
                  <div
                    className="legend-item clickable"
                    onClick={() => handlePieClick({ name: "Idle" })}
                  >
                    <span
                      className="legend-color"
                      style={{ background: "#9E9E9E" }}
                    ></span>
                    <span>Idle ({pieChartData[2].value})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - Bar Chart */}
            <div
              className="dashboard-card chart-card"
              onClick={() => setShowActivityModal(true)}
            >
              <div className="card-header">
                <h3 className="card-title">Activities by Entity</h3>
                <span className="click-hint">Click to view details</span>
              </div>
              <div className="card-body chart-container">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barChartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(94, 200, 196, 0.2)"
                    />
                    <XAxis dataKey="entity" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: "white",
                        border: "none",
                        borderRadius: "10px",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="url(#colorGradient)"
                      radius={[10, 10, 0, 0]}
                      name="Activities"
                    />
                    <defs>
                      <linearGradient
                        id="colorGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#5ec8c4" />
                        <stop offset="100%" stopColor="#f195b3" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="quick-stat-item">
              <div className="quick-stat-label">Monthly Output</div>
              <div className="quick-stat-value">
                {stats.monthlyOutput.toLocaleString()} units
              </div>
            </div>
            <div className="quick-stat-item">
              <div className="quick-stat-label">Completed Orders</div>
              <div className="quick-stat-value">{stats.completedOrders}</div>
            </div>
            <div className="quick-stat-item">
              <div className="quick-stat-label">Total Machines</div>
              <div className="quick-stat-value">{stats.totalMachines}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Production Line Modal */}
      {showProductionModal && (
        <div className="modal-overlay" onClick={closeProductionModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {selectedStatus
                  ? `${selectedStatus} Lines`
                  : "Production Line Status Details"}
              </h2>
              <button className="close-button" onClick={closeProductionModal}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {selectedStatus && (
                <div className="filter-info">
                  <span
                    className={`status-filter-badge ${getStatusClass(
                      selectedStatus
                    )}`}
                  >
                    Showing: {selectedStatus}
                  </span>
                  <button
                    className="clear-filter-btn"
                    onClick={() => setSelectedStatus(null)}
                  >
                    Show All
                  </button>
                </div>
              )}
              {getFilteredProductionLines().length > 0 ? (
                <table className="dashboard-table modal-table">
                  <thead>
                    <tr>
                      <th>Line</th>
                      <th>Status</th>
                      <th>Efficiency</th>
                      <th>Output</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredProductionLines().map((line) => (
                      <tr key={line.id}>
                        <td>{line.name}</td>
                        <td>
                          <span
                            className={`line-status ${getStatusClass(
                              line.status
                            )}`}
                          >
                            {line.status}
                          </span>
                        </td>
                        <td>
                          <div className="efficiency-bar">
                            <div
                              className="efficiency-fill"
                              style={{ width: `${line.efficiency}%` }}
                            ></div>
                            <span className="efficiency-text">
                              {line.efficiency}%
                            </span>
                          </div>
                        </td>
                        <td>{line.output} units</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-data-message">
                  No production lines with status "{selectedStatus}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Activities Modal */}
      {showActivityModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowActivityModal(false)}
        >
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Recent Activities</h2>
              <button
                className="close-button"
                onClick={() => setShowActivityModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="activity-list">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-avatar">
                      {activity.user.charAt(0).toUpperCase()}
                    </div>
                    <div className="activity-info">
                      <div className="activity-action">
                        <strong>{activity.user}</strong> {activity.action}
                      </div>
                      <div className="activity-meta">
                        <span className="activity-entity">
                          {activity.entity}
                        </span>
                        <span className="activity-time">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="btn-primary view-all-modal-btn"
                onClick={() => navigate("/admin/audit-log")}
              >
                View All in Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
