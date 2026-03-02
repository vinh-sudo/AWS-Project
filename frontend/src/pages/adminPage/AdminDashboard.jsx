import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
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
import adminService from "../../services/adminService";
import imsLogo from "../../assets/ims2.jpg";
import dashboardIcon from "../../assets/dashboard.jpg";
import userIcon from "../../assets/user.jpg";
import auditIcon from "../../assets/auditlog.jpg";
import "./adminUser.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dashboard statistics
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    inProgressOrders: 0,
    cancelledOrders: 0,
    totalLines: 0,
    activeLines: 0,
    totalMachines: 0,
    activeMachines: 0,
  });

  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getDashboardStats();
      setStats({
        totalUsers: data.totalUsers || 0,
        activeUsers: data.activeUsers || 0,
        blockedUsers: data.blockedUsers || 0,
        totalOrders: data.totalOrders || 0,
        pendingOrders: data.pendingOrders || 0,
        completedOrders: data.completedOrders || 0,
        inProgressOrders: data.inProgressOrders || 0,
        cancelledOrders: data.cancelledOrders || 0,
        totalLines: data.totalLines || 0,
        activeLines: data.activeLines || 0,
        totalMachines: data.totalMachines || 0,
        activeMachines: data.activeMachines || 0,
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Production line data derived from real API stats
  const pieChartData = [
    {
      name: "Active Lines",
      value: stats.activeLines,
      color: "#4CAF50",
    },
    {
      name: "Inactive Lines",
      value: Math.max(0, stats.totalLines - stats.activeLines),
      color: "#9E9E9E",
    },
  ];

  // Data for Bar Chart (Order Status Distribution from real stats)
  const barChartData = [
    { status: "Pending", count: stats.pendingOrders },
    { status: "In Progress", count: stats.inProgressOrders },
    { status: "Completed", count: stats.completedOrders },
    { status: "Cancelled", count: stats.cancelledOrders },
  ];

  const COLORS = ["#5ec8c4", "#f195b3", "#9E9E9E"];

  const dispatch = useDispatch();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="admin-container">
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <img src={imsLogo} alt="Logo" className="sidebar-logo" />
          <div className="sidebar-title">IMS ADMIN</div>
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

        <div className="admin-content dashboard-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-skeleton">
                <div className="skeleton-icon"></div>
                <div className="loading-dots">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
                <p className="loading-text">Loading dashboard data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="error-container">
              <div className="error-icon">⚠️</div>
              <p className="error-message">{error}</p>
              <button className="btn-primary" onClick={fetchDashboardData}>
                Retry
              </button>
            </div>
          ) : (
            <>
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
                      {stats.activeLines}/{stats.totalLines}
                    </div>
                    <div className="stat-label">Production Lines</div>
                    <div className="stat-detail">
                      <span className="stat-machines">
                        {stats.activeMachines}/{stats.totalMachines} Machines
                      </span>
                    </div>
                  </div>
                </div>

                <div className="stat-card stat-efficiency">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.completedOrders}</div>
                    <div className="stat-label">Completed Orders</div>
                    <div className="stat-detail">
                      <span className="stat-output">
                        {stats.cancelledOrders} cancelled
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
                    <h3 className="card-title">Production Lines Overview</h3>
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
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="chart-legend-custom">
                      <div className="legend-item">
                        <span
                          className="legend-color"
                          style={{ background: "#4CAF50" }}
                        ></span>
                        <span>Active ({stats.activeLines})</span>
                      </div>
                      <div className="legend-item">
                        <span
                          className="legend-color"
                          style={{ background: "#9E9E9E" }}
                        ></span>
                        <span>
                          Inactive (
                          {Math.max(0, stats.totalLines - stats.activeLines)})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Status Distribution - Bar Chart */}
                <div className="dashboard-card chart-card">
                  <div className="card-header">
                    <h3 className="card-title">Order Status Distribution</h3>
                  </div>
                  <div className="card-body chart-container">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={barChartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(94, 200, 196, 0.2)"
                        />
                        <XAxis dataKey="status" tick={{ fontSize: 12 }} />
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
                  <div className="quick-stat-label">Pending Orders</div>
                  <div className="quick-stat-value">{stats.pendingOrders}</div>
                </div>
                <div className="quick-stat-item">
                  <div className="quick-stat-label">Completed Orders</div>
                  <div className="quick-stat-value">
                    {stats.completedOrders}
                  </div>
                </div>
                <div className="quick-stat-item">
                  <div className="quick-stat-label">In Progress</div>
                  <div className="quick-stat-value">
                    {stats.inProgressOrders}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Order Summary Modal */}
      {showActivityModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowActivityModal(false)}
        >
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">System Overview</h2>
              <button
                className="close-button"
                onClick={() => setShowActivityModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-info">
                    <div className="activity-action">
                      Total Orders: <strong>{stats.totalOrders}</strong>
                    </div>
                    <div className="activity-meta">
                      <span className="activity-entity">
                        Pending: {stats.pendingOrders} | In Progress:{" "}
                        {stats.inProgressOrders} | Completed:{" "}
                        {stats.completedOrders} | Cancelled:{" "}
                        {stats.cancelledOrders}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-info">
                    <div className="activity-action">
                      Production Lines:{" "}
                      <strong>
                        {stats.activeLines}/{stats.totalLines}
                      </strong>{" "}
                      active
                    </div>
                    <div className="activity-meta">
                      <span className="activity-entity">
                        Machines: {stats.activeMachines}/{stats.totalMachines}{" "}
                        active
                      </span>
                    </div>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-info">
                    <div className="activity-action">
                      Users: <strong>{stats.totalUsers}</strong> total
                    </div>
                    <div className="activity-meta">
                      <span className="activity-entity">
                        Active: {stats.activeUsers} | Blocked:{" "}
                        {stats.blockedUsers}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                className="btn-primary view-all-modal-btn"
                onClick={() => navigate("/admin/orders")}
              >
                View All Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
