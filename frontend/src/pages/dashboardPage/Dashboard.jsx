import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux";
import authService from "../../services/authService";
import AICopilot from "../../components/AICopilot/AICopilot";
import imsLogo from "../../assets/ims2.jpg";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [showCopilot, setShowCopilot] = useState(false);

  // Mock Real-time Stats
  const realTimeStats = {
    activeLines: 3,
    totalLines: 4,
    currentOEE: 78.5,
    unitsProducedToday: 8750,
    targetToday: 12000,
    pendingOrders: 12,
    criticalAlerts: 2,
    workersOnline: 24,
  };

  // Line Status Data
  const lineStatus = [
    {
      name: "SMT Line 1",
      status: "Running",
      oee: 85,
      currentOrder: "ORD-001",
      progress: 64,
    },
    {
      name: "SMT Line 2",
      status: "Running",
      oee: 72,
      currentOrder: "ORD-003",
      progress: 35,
    },
    {
      name: "Assembly Line 1",
      status: "Idle",
      oee: 0,
      currentOrder: "-",
      progress: 0,
    },
    {
      name: "Test Line 1",
      status: "Running",
      oee: 60,
      currentOrder: "ORD-002",
      progress: 100,
    },
  ];

  // Recent Orders
  const recentOrders = [
    {
      id: "ORD-001",
      customer: "TechCorp Inc.",
      product: "PCB-A100",
      quantity: 5000,
      status: "In Progress",
      dueDate: "2025-01-25",
    },
    {
      id: "ORD-002",
      customer: "ElectroParts Ltd.",
      product: "PCB-B200",
      quantity: 3000,
      status: "Completed",
      dueDate: "2025-01-20",
    },
    {
      id: "ORD-003",
      customer: "MicroTech Co.",
      product: "PCB-C300",
      quantity: 8000,
      status: "At Risk",
      dueDate: "2025-01-28",
    },
    {
      id: "ORD-004",
      customer: "DigiSys Corp.",
      product: "PCB-D400",
      quantity: 2500,
      status: "Pending",
      dueDate: "2025-01-30",
    },
  ];

  // Alerts
  const alerts = [
    {
      id: 1,
      type: "critical",
      message: "Reflow Oven R2 efficiency below threshold (70%)",
      time: "10 mins ago",
    },
    {
      id: 2,
      type: "critical",
      message: "Order ORD-003 at risk - deadline approaching",
      time: "25 mins ago",
    },
    {
      id: 3,
      type: "warning",
      message: "Low stock alert: Component IC-2045 (200 units remaining)",
      time: "1 hour ago",
    },
    {
      id: 4,
      type: "info",
      message: "Scheduled maintenance for Test Line 1 at 18:00",
      time: "2 hours ago",
    },
  ];

  // Weekly Production Data (for chart)
  const weeklyData = [
    { day: "Mon", produced: 4500, target: 5000 },
    { day: "Tue", produced: 4800, target: 5000 },
    { day: "Wed", produced: 5200, target: 5000 },
    { day: "Thu", produced: 4200, target: 5000 },
    { day: "Fri", produced: 4900, target: 5000 },
    { day: "Sat", produced: 3500, target: 4000 },
    { day: "Sun", produced: 2800, target: 3000 },
  ];

  const dispatch = useDispatch();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Running":
      case "Completed":
        return "status-good";
      case "In Progress":
        return "status-progress";
      case "Idle":
      case "Pending":
        return "status-idle";
      case "At Risk":
        return "status-risk";
      default:
        return "";
    }
  };

  const getAlertClass = (type) => {
    switch (type) {
      case "critical":
        return "alert-critical";
      case "warning":
        return "alert-warning";
      case "info":
        return "alert-info";
      default:
        return "";
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <img src={imsLogo} alt="IMS Logo" className="sidebar-logo" />
          <span className="sidebar-title">IMS</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-item active">
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </div>
          <div
            className="nav-item"
            onClick={() => navigate("/planner/assignment")}
          >
            <span className="nav-icon">📋</span>
            <span>Orders</span>
          </div>
          <div className="nav-item" onClick={() => navigate("/admin/lines")}>
            <span className="nav-icon">🏭</span>
            <span>Lines</span>
          </div>
          <div
            className="nav-item"
            onClick={() => navigate("/planner/scheduling")}
          >
            <span className="nav-icon">📅</span>
            <span>Scheduling</span>
          </div>
          <div className="nav-item" onClick={() => navigate("/reports")}>
            <span className="nav-icon">📈</span>
            <span>Reports</span>
          </div>
          <div className="nav-item" onClick={() => setShowCopilot(true)}>
            <span className="nav-icon">🤖</span>
            <span>AI Copilot</span>
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="nav-item logout" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span>Logout</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Production Dashboard</h1>
            <p>Real-time overview of your production operations</p>
          </div>
          <div className="header-right">
            <div className="live-indicator">
              <span className="live-dot"></span>
              Live
            </div>
            <div className="user-info">
              <span className="user-name">
                {currentUser?.fullName || "User"}
              </span>
              <span className="user-role">{currentUser?.role || "Admin"}</span>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">🏭</div>
            <div className="stat-content">
              <span className="stat-number">
                {realTimeStats.activeLines}/{realTimeStats.totalLines}
              </span>
              <span className="stat-label">Active Lines</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <span className="stat-number">{realTimeStats.currentOEE}%</span>
              <span className="stat-label">Current OEE</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <span className="stat-number">
                {realTimeStats.unitsProducedToday.toLocaleString()}
              </span>
              <span className="stat-label">Units Today</span>
              <div className="stat-progress">
                <div
                  className="stat-progress-fill"
                  style={{
                    width: `${(realTimeStats.unitsProducedToday / realTimeStats.targetToday) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <span className="stat-number">{realTimeStats.pendingOrders}</span>
              <span className="stat-label">Pending Orders</span>
            </div>
          </div>
          <div className="stat-card alert">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <span className="stat-number">
                {realTimeStats.criticalAlerts}
              </span>
              <span className="stat-label">Critical Alerts</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <span className="stat-number">{realTimeStats.workersOnline}</span>
              <span className="stat-label">Workers Online</span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="main-grid">
          {/* Line Status */}
          <div className="grid-card line-status-card">
            <h2 className="card-title">Line Status</h2>
            <div className="line-status-list">
              {lineStatus.map((line, index) => (
                <div key={index} className="line-status-item">
                  <div className="line-info">
                    <span className="line-name">{line.name}</span>
                    <span
                      className={`line-status-badge ${getStatusClass(line.status)}`}
                    >
                      {line.status}
                    </span>
                  </div>
                  <div className="line-details">
                    <span className="oee-value">OEE: {line.oee}%</span>
                    <span className="current-order">{line.currentOrder}</span>
                  </div>
                  {line.status === "Running" && (
                    <div className="line-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${line.progress}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{line.progress}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Chart */}
          <div className="grid-card chart-card">
            <h2 className="card-title">Weekly Production</h2>
            <div className="chart-container">
              <div className="bar-chart">
                {weeklyData.map((day, index) => (
                  <div key={index} className="chart-column">
                    <div className="bar-wrapper">
                      <div
                        className="bar produced"
                        style={{ height: `${(day.produced / 6000) * 150}px` }}
                        title={`Produced: ${day.produced}`}
                      >
                        <span className="bar-value">
                          {(day.produced / 1000).toFixed(1)}k
                        </span>
                      </div>
                    </div>
                    <span className="chart-label">{day.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="grid-card orders-card">
            <div className="card-header">
              <h2 className="card-title">Recent Orders</h2>
              <button
                className="btn-view-all"
                onClick={() => navigate("/planner/assignment")}
              >
                View All
              </button>
            </div>
            <div className="orders-list">
              {recentOrders.map((order, index) => (
                <div key={index} className="order-item">
                  <div className="order-main">
                    <span className="order-id">{order.id}</span>
                    <span className="order-product">{order.product}</span>
                    <span
                      className={`order-status ${getStatusClass(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="order-details">
                    <span className="order-customer">{order.customer}</span>
                    <span className="order-quantity">
                      {order.quantity.toLocaleString()} units
                    </span>
                    <span className="order-due">Due: {order.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="grid-card alerts-card">
            <h2 className="card-title">Recent Alerts</h2>
            <div className="alerts-list">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`alert-item ${getAlertClass(alert.type)}`}
                >
                  <div className="alert-icon">
                    {alert.type === "critical" && "🔴"}
                    {alert.type === "warning" && "🟡"}
                    {alert.type === "info" && "🔵"}
                  </div>
                  <div className="alert-content">
                    <span className="alert-message">{alert.message}</span>
                    <span className="alert-time">{alert.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* AI Copilot */}
      <AICopilot isOpen={showCopilot} onClose={() => setShowCopilot(false)} />
    </div>
  );
};

export default Dashboard;
