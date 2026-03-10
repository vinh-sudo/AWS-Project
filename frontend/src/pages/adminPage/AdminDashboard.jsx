import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import AdminSidebar from "../../components/AdminSidebar/AdminSidebar";
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
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

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

  const [recentOrders, setRecentOrders] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);

  const fetchDashboardData = useCallback(async () => {
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

      try {
        const allOrders = await adminService.getAllOrders();
        const sorted = Array.isArray(allOrders)
          ? [...allOrders]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 5)
          : [];
        setRecentOrders(sorted);
      } catch {
        setRecentOrders([]);
      }

      try {
        const deadlines = await adminService.getUpcomingDeadlineOrders(7);
        setUpcomingDeadlines(
          Array.isArray(deadlines) ? deadlines.slice(0, 6) : [],
        );
      } catch {
        setUpcomingDeadlines([]);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Computed metrics
  const efficiencyRate =
    stats.totalOrders > 0
      ? ((stats.completedOrders / stats.totalOrders) * 100).toFixed(1)
      : 0;

  const lineUtilization =
    stats.totalLines > 0
      ? ((stats.activeLines / stats.totalLines) * 100).toFixed(1)
      : 0;

  const machineUtilization =
    stats.totalMachines > 0
      ? ((stats.activeMachines / stats.totalMachines) * 100).toFixed(1)
      : 0;

  // Chart data
  const orderStatusData = [
    { name: "Pending", value: stats.pendingOrders, color: "#f59e0b" },
    { name: "In Progress", value: stats.inProgressOrders, color: "#3b82f6" },
    { name: "Completed", value: stats.completedOrders, color: "#10b981" },
    { name: "Cancelled", value: stats.cancelledOrders, color: "#ef4444" },
  ];

  const productionData = [
    { name: "Lines Active", value: stats.activeLines, color: "#10b981" },
    {
      name: "Lines Inactive",
      value: Math.max(0, stats.totalLines - stats.activeLines),
      color: "#e2e8f0",
    },
  ];

  const barData = [
    { status: "Pending", count: stats.pendingOrders, fill: "#f59e0b" },
    { status: "In Progress", count: stats.inProgressOrders, fill: "#3b82f6" },
    { status: "Completed", count: stats.completedOrders, fill: "#10b981" },
    { status: "Cancelled", count: stats.cancelledOrders, fill: "#ef4444" },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Draft":
        return "badge-pending";
      case "Confirmed":
        return "badge-pending";
      case "PLANNING":
        return "badge-progress";
      case "SCHEDULED":
        return "badge-progress";
      case "In Production":
        return "badge-progress";
      case "Completed":
        return "badge-completed";
      case "Cancelled":
        return "badge-cancelled";
      case "STOPPED":
        return "badge-cancelled";
      default:
        return "badge-default";
    }
  };

  const getUserInitial = () => {
    const name = currentUser?.fullName || "Admin";
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="admin-container">
        <AdminSidebar />
        <div className="admin-main">
          <div className="dash-loading">
            <div className="dash-loading-card">
              <div className="dash-spinner"></div>
              <p className="dash-loading-text">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <AdminSidebar />

      <div className="admin-main">
        {/* ===== Gradient Header ===== */}
        <header className="dash-header">
          <div className="dash-header-left">
            <div className="dash-header-avatar">{getUserInitial()}</div>
            <div>
              <h1 className="dash-title">
                {getGreeting()},{" "}
                {currentUser?.fullName?.split(" ")[0] || "Admin"} 👋
              </h1>
              <p className="dash-subtitle">
                Here's what's happening with your production system
                {lastUpdated && (
                  <span className="dash-last-updated">
                    {" "}
                    · Updated{" "}
                    {lastUpdated.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="dash-header-right">
            <button
              className="dash-refresh-btn"
              onClick={fetchDashboardData}
              title="Refresh data"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
            </button>
            <NotificationBell />
          </div>
        </header>

        <div className="dash-content">
          {error && (
            <div className="dash-error">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
              <button onClick={fetchDashboardData}>Retry</button>
            </div>
          )}

          {/* ===== Stat Cards ===== */}
          <div className="dash-stats">
            {/* Total Users */}
            <div className="dash-stat-card">
              <div className="dash-stat-header">
                <div className="dash-stat-icon dash-icon-users">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <span className="dash-stat-badge dash-badge-blue">
                  {stats.activeUsers} active
                </span>
              </div>
              <div className="dash-stat-value">{stats.totalUsers}</div>
              <div className="dash-stat-label">Total Users</div>
              <div className="dash-stat-bar">
                <div
                  className="dash-stat-bar-fill dash-bar-blue"
                  style={{
                    width:
                      stats.totalUsers > 0
                        ? `${(stats.activeUsers / stats.totalUsers) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>

            {/* Total Orders */}
            <div className="dash-stat-card">
              <div className="dash-stat-header">
                <div className="dash-stat-icon dash-icon-orders">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                </div>
                <span className="dash-stat-badge dash-badge-amber">
                  {stats.pendingOrders} pending
                </span>
              </div>
              <div className="dash-stat-value">{stats.totalOrders}</div>
              <div className="dash-stat-label">Total Orders</div>
              <div className="dash-stat-bar">
                <div
                  className="dash-stat-bar-fill dash-bar-amber"
                  style={{
                    width:
                      stats.totalOrders > 0
                        ? `${(stats.completedOrders / stats.totalOrders) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>

            {/* Production Lines */}
            <div className="dash-stat-card">
              <div className="dash-stat-header">
                <div className="dash-stat-icon dash-icon-lines">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M2 20h.01" />
                    <path d="M7 20v-4" />
                    <path d="M12 20v-8" />
                    <path d="M17 20V8" />
                    <path d="M22 4v16" />
                  </svg>
                </div>
                <span className="dash-stat-badge dash-badge-green">
                  {lineUtilization}% util
                </span>
              </div>
              <div className="dash-stat-value">
                {stats.activeLines}
                <span className="dash-stat-total">/{stats.totalLines}</span>
              </div>
              <div className="dash-stat-label">Active Lines</div>
              <div className="dash-stat-bar">
                <div
                  className="dash-stat-bar-fill dash-bar-green"
                  style={{ width: `${lineUtilization}%` }}
                />
              </div>
            </div>

            {/* Efficiency */}
            <div className="dash-stat-card">
              <div className="dash-stat-header">
                <div className="dash-stat-icon dash-icon-efficiency">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <span className="dash-stat-badge dash-badge-purple">
                  {stats.completedOrders} done
                </span>
              </div>
              <div className="dash-stat-value">{efficiencyRate}%</div>
              <div className="dash-stat-label">Completion Rate</div>
              <div className="dash-stat-bar">
                <div
                  className="dash-stat-bar-fill dash-bar-purple"
                  style={{ width: `${efficiencyRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* ===== Quick Actions ===== */}
          <div className="dash-quick-actions">
            <button
              className="dash-quick-btn"
              onClick={() => navigate("/admin/orders")}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
              </svg>
              Manage Orders
            </button>
            <button
              className="dash-quick-btn"
              onClick={() => navigate("/admin/users")}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              Manage Users
            </button>
            <button
              className="dash-quick-btn"
              onClick={() => navigate("/admin/assignments")}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
              Assignments
            </button>
            <button
              className="dash-quick-btn"
              onClick={() => navigate("/admin/audit-log")}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Audit Log
            </button>
          </div>

          {/* ===== Charts Row ===== */}
          <div className="dash-charts">
            {/* Order Status Bar Chart */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h3 className="dash-card-title">
                  <span className="dash-card-title-icon icon-chart">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </span>
                  Order Status Distribution
                </h3>
                <button
                  className="dash-card-action"
                  onClick={() => navigate("/admin/orders")}
                >
                  View All →
                </button>
              </div>
              <div className="dash-card-body">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData} barCategoryGap="25%">
                    <defs>
                      <linearGradient
                        id="barPending"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                        <stop
                          offset="100%"
                          stopColor="#fbbf24"
                          stopOpacity={0.8}
                        />
                      </linearGradient>
                      <linearGradient
                        id="barProgress"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                        <stop
                          offset="100%"
                          stopColor="#60a5fa"
                          stopOpacity={0.8}
                        />
                      </linearGradient>
                      <linearGradient
                        id="barCompleted"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                        <stop
                          offset="100%"
                          stopColor="#34d399"
                          stopOpacity={0.8}
                        />
                      </linearGradient>
                      <linearGradient
                        id="barCancelled"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                        <stop
                          offset="100%"
                          stopColor="#f87171"
                          stopOpacity={0.8}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f1f5f9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="status"
                      tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                        padding: "12px 16px",
                      }}
                      cursor={{ fill: "rgba(99, 102, 241, 0.04)" }}
                    />
                    <Bar dataKey="count" radius={[10, 10, 0, 0]} name="Orders">
                      {barData.map((entry, index) => {
                        const gradients = [
                          "url(#barPending)",
                          "url(#barProgress)",
                          "url(#barCompleted)",
                          "url(#barCancelled)",
                        ];
                        return (
                          <Cell key={`cell-${index}`} fill={gradients[index]} />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="dash-chart-legend">
                  {orderStatusData.map((item) => (
                    <div key={item.name} className="dash-legend-item">
                      <span
                        className="dash-legend-dot"
                        style={{ background: item.color }}
                      ></span>
                      {item.name}: {item.value}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Production Lines Pie Chart */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h3 className="dash-card-title">
                  <span className="dash-card-title-icon icon-pie">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M21.21 15.89A10 10 0 118 2.83" />
                      <path d="M22 12A10 10 0 0012 2v10z" />
                    </svg>
                  </span>
                  Production Overview
                </h3>
              </div>
              <div className="dash-card-body">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <defs>
                      <linearGradient
                        id="pieActive"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#34d399" />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={productionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {productionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? "url(#pieActive)" : entry.color}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                        padding: "10px 14px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="dash-pie-center">
                  <span className="dash-pie-value">{lineUtilization}%</span>
                  <span className="dash-pie-label">Utilization</span>
                </div>
                {/* Machine stats */}
                <div className="dash-machine-stats">
                  <div className="dash-machine-item">
                    <span className="dash-dot dash-dot-green"></span>
                    <span>
                      Machines: {stats.activeMachines}/{stats.totalMachines} (
                      {machineUtilization}%)
                    </span>
                  </div>
                  <div className="dash-machine-item">
                    <span className="dash-dot dash-dot-gray"></span>
                    <span>
                      Idle: {stats.totalMachines - stats.activeMachines}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== Bottom Row: Recent Orders + Activities ===== */}
          <div className="dash-bottom-row">
            {/* Recent Orders */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h3 className="dash-card-title">
                  <span className="dash-card-title-icon icon-orders">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                    </svg>
                  </span>
                  Recent Orders
                </h3>
                <button
                  className="dash-card-action"
                  onClick={() => navigate("/admin/orders")}
                >
                  View All →
                </button>
              </div>
              <div className="dash-card-body">
                {recentOrders.length > 0 ? (
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Product</th>
                        <th>Status</th>
                        <th>Quantity</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order, idx) => (
                        <tr key={order.id || idx}>
                          <td className="dash-table-id">
                            #{order.id || idx + 1}
                          </td>
                          <td>{order.productName || order.product || "-"}</td>
                          <td>
                            <span
                              className={`dash-badge ${getStatusBadgeClass(
                                order.status,
                              )}`}
                            >
                              {order.status || "-"}
                            </span>
                          </td>
                          <td>{order.quantity || "-"}</td>
                          <td className="dash-table-date">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString()
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="dash-empty">
                    <div className="dash-empty-icon">
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                      >
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 01-8 0" />
                      </svg>
                    </div>
                    <p>No recent orders to display</p>
                    <button
                      className="dash-empty-btn"
                      onClick={() => navigate("/admin/orders")}
                    >
                      Go to Orders
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h3 className="dash-card-title">
                  <span className="dash-card-title-icon icon-activity">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </span>
                  Upcoming Deadlines (7 days)
                </h3>
                <button
                  className="dash-card-action"
                  onClick={() => navigate("/admin/orders")}
                >
                  View All →
                </button>
              </div>
              <div className="dash-card-body">
                {upcomingDeadlines.length > 0 ? (
                  <div className="dash-activity-list">
                    {upcomingDeadlines.map((order, idx) => {
                      const deadline = order.deadline || order.dueDate;
                      const daysLeft = deadline
                        ? Math.ceil(
                            (new Date(deadline) - new Date()) /
                              (1000 * 60 * 60 * 24),
                          )
                        : null;
                      return (
                        <div
                          key={order.id || idx}
                          className="dash-activity-item"
                        >
                          <div
                            className="dash-activity-dot"
                            style={{
                              background:
                                daysLeft !== null && daysLeft <= 2
                                  ? "#ef4444"
                                  : daysLeft <= 4
                                    ? "#f59e0b"
                                    : "#3b82f6",
                            }}
                          ></div>
                          <div className="dash-activity-content">
                            <p className="dash-activity-text">
                              <strong>#{order.id}</strong>{" "}
                              {order.productName ||
                                order.customerName ||
                                "Order"}
                              {daysLeft !== null && (
                                <span
                                  style={{
                                    marginLeft: 8,
                                    fontSize: "0.75rem",
                                    color:
                                      daysLeft <= 2 ? "#ef4444" : "#f59e0b",
                                    fontWeight: 600,
                                  }}
                                >
                                  {daysLeft <= 0
                                    ? "Overdue!"
                                    : `${daysLeft}d left`}
                                </span>
                              )}
                            </p>
                            <span className="dash-activity-time">
                              {deadline
                                ? new Date(deadline).toLocaleDateString([], {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "-"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="dash-empty">
                    <div className="dash-empty-icon">
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <p>No upcoming deadlines</p>
                    <button
                      className="dash-empty-btn"
                      onClick={() => navigate("/admin/orders")}
                    >
                      View Orders
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
