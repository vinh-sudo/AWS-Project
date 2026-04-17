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
  ResponsiveContainer,
} from "recharts";
import authService from "../../services/authService";
import adminService from "../../services/adminService";
import PageLoading from "../../components/PageLoading/PageLoading";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignments, setAssignments] = useState([]);

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    inProgressOrders: 0,
    cancelledOrders: 0,
    orderStatusDistribution: [],
    totalLines: 0,
    activeLines: 0,
    totalMachines: 0,
    activeMachines: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashboardData, assignmentData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getAssignments().catch(() => null),
      ]);

      const data = dashboardData || {};
      const hasAssignmentData = Array.isArray(assignmentData);
      const normalizedAssignments = hasAssignmentData ? assignmentData : [];
      const activeLinesFromAssignments = hasAssignmentData
        ? new Set(
            normalizedAssignments
              .map((item) => item?.lineId)
              .filter((lineId) => lineId != null),
          ).size
        : data.activeLines || 0;

      setStats({
        totalUsers: data.totalUsers || 0,
        activeUsers: data.activeUsers || 0,
        blockedUsers: data.blockedUsers || 0,
        totalOrders: data.totalOrders || 0,
        pendingOrders: data.pendingOrders || 0,
        completedOrders: data.completedOrders || 0,
        inProgressOrders: data.inProgressOrders || 0,
        cancelledOrders: data.cancelledOrders || 0,
        orderStatusDistribution: data.orderStatusDistribution || [],
        totalLines: data.totalLines || 0,
        activeLines: Math.min(data.totalLines || 0, activeLinesFromAssignments),
        totalMachines: data.totalMachines || 0,
        activeMachines: data.activeMachines || 0,
      });
      setAssignments(normalizedAssignments);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
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

  // Chart data
  const orderStatusData = stats.orderStatusDistribution || [];

  const barData = orderStatusData.map((item) => ({
    status: item.name,
    statusKey: item.key,
    count: item.value,
    fill: item.color,
  }));

  const userManagementData = [
    { name: "Active", value: stats.activeUsers, color: "#10b981" },
    { name: "Blocked", value: stats.blockedUsers, color: "#f59e0b" },
  ];

  const userActiveRate =
    stats.totalUsers > 0
      ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)
      : 0;

  const assignmentPreview = assignments.slice(0, 5);
  const assignedLines = new Set(
    assignments.map((item) => item?.lineId).filter((lineId) => lineId != null),
  ).size;
  const unassignedLines = Math.max(0, stats.totalLines - assignedLines);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
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
          <PageLoading variant="fullpage" text="Loading dashboard..." />
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
              </p>
            </div>
          </div>
          <div className="dash-header-right">
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
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
                <circle cx="7" cy="6" r="1" />
                <circle cx="12" cy="12" r="1" />
                <circle cx="17" cy="18" r="1" />
              </svg>
              Leader Assignment
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
            <div className="dash-card dash-card-full">
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
                      {barData.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.statusKey || index}`}
                          fill={entry.fill}
                        />
                      ))}
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
          </div>

          {/* ===== User + Leader Assignment ===== */}
          <div className="dash-secondary-grid">
            <div className="dash-card">
              <div className="dash-card-header">
                <h3 className="dash-card-title">
                  <span className="dash-card-title-icon icon-users-overview">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87" />
                      <path d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                  </span>
                  User Management Overview
                </h3>
                <button
                  className="dash-card-action"
                  onClick={() => navigate("/admin/users")}
                >
                  Open Users →
                </button>
              </div>
              <div className="dash-card-body dash-user-overview-body">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={userManagementData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {userManagementData.map((entry, index) => (
                        <Cell key={`user-cell-${index}`} fill={entry.color} />
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

                <div className="dash-pie-center dash-pie-center-users">
                  <span className="dash-pie-value">{userActiveRate}%</span>
                  <span className="dash-pie-label">Active Users</span>
                </div>

                <div className="dash-user-summary">
                  {userManagementData.map((item) => (
                    <div key={item.name} className="dash-user-summary-item">
                      <span
                        className="dash-legend-dot"
                        style={{ background: item.color }}
                      ></span>
                      <span>
                        {item.name}: <strong>{item.value}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="dash-card">
              <div className="dash-card-header">
                <h3 className="dash-card-title">
                  <span className="dash-card-title-icon icon-assignment-overview">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M8 6h13" />
                      <path d="M8 12h13" />
                      <path d="M8 18h13" />
                      <path d="M3 6h.01" />
                      <path d="M3 12h.01" />
                      <path d="M3 18h.01" />
                    </svg>
                  </span>
                  Leader Assignment Snapshot
                </h3>
                <button
                  className="dash-card-action"
                  onClick={() => navigate("/admin/assignments")}
                >
                  View Details →
                </button>
              </div>

              <div className="dash-card-body">
                <div className="dash-assignment-stats">
                  <div className="dash-assignment-stat">
                    <span className="dash-assignment-stat-label">Assigned</span>
                    <span className="dash-assignment-stat-value">
                      {assignedLines}
                    </span>
                  </div>
                  <div className="dash-assignment-stat">
                    <span className="dash-assignment-stat-label">Vacant</span>
                    <span className="dash-assignment-stat-value">
                      {unassignedLines}
                    </span>
                  </div>
                </div>

                {assignmentPreview.length > 0 ? (
                  <div className="dash-assignment-list">
                    {assignmentPreview.map((item) => (
                      <div
                        key={item.assignmentId}
                        className="dash-assignment-row"
                      >
                        <div className="dash-assignment-line">
                          {item.lineName || `Line ${item.lineId}`}
                        </div>
                        <div className="dash-assignment-leader">
                          {item.leaderUsername || "—"}
                        </div>
                        <div className="dash-assignment-code">
                          {item.leaderEmployeeCode || "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dash-empty-assignment">
                    No leader assignments found.
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
