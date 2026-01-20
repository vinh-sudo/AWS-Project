import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import authService from "../../services/authService";
import imsLogo from "../../assets/ims2.jpg";
import "./ManagerDashboard.css";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  // Mock data for stats
  const [stats] = useState({
    runningOrders: 12,
    lineUtilization: 85,
    atRiskOrders: 3,
    avgEfficiency: 78,
  });

  // Mock data for efficiency over time (line chart)
  const [efficiencyData] = useState([
    { name: "Jan 1", line1: 65, line2: 45 },
    { name: "Jan 2", line1: 78, line2: 52 },
    { name: "Jan 3", line1: 62, line2: 48 },
    { name: "Jan 4", line1: 85, line2: 58 },
    { name: "Jan 5", line1: 92, line2: 72 },
    { name: "Jan 6", line1: 88, line2: 65 },
    { name: "Jan 7", line1: 75, line2: 62 },
    { name: "Jan 8", line1: 82, line2: 68 },
    { name: "Jan 9", line1: 95, line2: 72 },
  ]);

  // Mock data for running orders
  const [runningOrders] = useState([
    {
      id: "ORD-001",
      customer: "ABC Corp",
      line: "Line A",
      progress: 75,
      deadline: "Jan 30, 2026",
      status: "On Track",
    },
    {
      id: "ORD-002",
      customer: "XYZ Ltd",
      line: "Line B",
      progress: 60,
      deadline: "Feb 15, 2026",
      status: "Delayed",
    },
    {
      id: "ORD-003",
      customer: "DEF Inc",
      line: "Line D",
      progress: 45,
      deadline: "Feb 20, 2026",
      status: "Pending",
    },
    {
      id: "ORD-004",
      customer: "GHI Company",
      line: "Line A",
      progress: 90,
      deadline: "Jan 25, 2026",
      status: "On Track",
    },
    {
      id: "ORD-005",
      customer: "JKL Corp",
      line: "Line E",
      progress: 30,
      deadline: "Feb 05, 2026",
      status: "At Risk",
    },
  ]);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "On Track":
        return "status-ontrack";
      case "Delayed":
        return "status-delay";
      case "At Risk":
        return "status-atrisk";
      case "Pending":
        return "status-pending";
      default:
        return "";
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 70) return "#4CAF50";
    if (progress >= 40) return "#2196F3";
    return "#f44336";
  };

  return (
    <div className="manager-container">
      {/* Sidebar */}
      <div className="manager-sidebar">
        <div className="sidebar-header">
          <img src={imsLogo} alt="Logo" className="sidebar-logo" />
          <div className="sidebar-title">IMS Manager</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item active">
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </div>
          <div className="nav-item" onClick={() => navigate("/manager/orders")}>
            <span className="nav-icon">📦</span>
            <span>Orders</span>
          </div>
          <div
            className="nav-item"
            onClick={() => navigate("/manager/scheduling")}
          >
            <span className="nav-icon">📅</span>
            <span>Scheduling</span>
          </div>
          <div className="nav-item" onClick={() => navigate("/manager/lines")}>
            <span className="nav-icon">🏭</span>
            <span>Production Lines</span>
          </div>
          <div
            className="nav-item"
            onClick={() => navigate("/manager/reports")}
          >
            <span className="nav-icon">📈</span>
            <span>Reports</span>
          </div>
        </nav>

        <div className="logout-item">
          <div className="nav-item logout" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span>Logout</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="manager-main">
        {/* Header */}
        <header className="manager-header">
          <div className="header-left">
            <span className="header-badge">Manager</span>
            <h1 className="header-title">Production Manager</h1>
          </div>
          <div className="header-actions">
            <button className="header-icon-btn">🔔</button>
            <button className="header-icon-btn">⚙️</button>
            <button className="header-icon-btn notification-badge">💬</button>
            <div className="user-menu">
              <div className="user-avatar"></div>
              <span className="user-name">
                {currentUser?.fullName || "Manager"}
              </span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="manager-content">
          {/* Stats Cards */}
          <div className="manager-stats-grid">
            <div className="manager-stat-card">
              <div className="stat-label">Running Orders</div>
              <div className="stat-value blue">{stats.runningOrders}</div>
            </div>
            <div className="manager-stat-card">
              <div className="stat-label">Line Utilization</div>
              <div className="stat-value blue">{stats.lineUtilization}%</div>
            </div>
            <div className="manager-stat-card">
              <div className="stat-label">At Risk Orders</div>
              <div className="stat-value green">{stats.atRiskOrders}</div>
            </div>
            <div className="manager-stat-card">
              <div className="stat-label">Average Efficiency</div>
              <div className="stat-value green">{stats.avgEfficiency}%</div>
            </div>
          </div>

          {/* Efficiency Chart */}
          <div className="manager-card">
            <div className="card-header">
              <h3 className="card-title">Efficiency Over Time</h3>
              <button className="card-menu-btn">⋯</button>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={efficiencyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.1)"
                  />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="line1"
                    stroke="#2196F3"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Line 1"
                  />
                  <Line
                    type="monotone"
                    dataKey="line2"
                    stroke="#f44336"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Line 2"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Running Orders Table */}
          <div className="manager-card">
            <div className="card-header">
              <h3 className="card-title">Running Orders</h3>
              <button className="card-menu-btn">⋯</button>
            </div>
            <div className="card-body">
              <table className="manager-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Line</th>
                    <th>Progress</th>
                    <th>Deadline</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {runningOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="order-id">{order.id}</td>
                      <td className="customer-cell">{order.customer}</td>
                      <td>{order.line}</td>
                      <td>
                        <div className="progress-cell">
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${order.progress}%`,
                                backgroundColor: getProgressColor(
                                  order.progress
                                ),
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td>{order.deadline}</td>
                      <td>
                        <span
                          className={`order-status ${getStatusClass(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
