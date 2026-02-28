import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import managerService from "../../services/managerService";
import authService from "../../services/authService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./ManagerDashboard.css";

const ManagerDashboard = () => {
  const [linesOverview, setLinesOverview] = useState([]);
  const [oeeData, setOeeData] = useState([]);
  const [delays, setDelays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const currentUser = authService.getCurrentUser();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const avatarRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        avatarRef.current &&
        !avatarRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [linesRes, oeeRes, delaysRes] = await Promise.all([
        managerService.getLinesOverview(),
        managerService.getOEE(selectedDate),
        managerService.getDelays(),
      ]);

      setLinesOverview(linesRes || []);
      setOeeData(oeeRes || []);
      setDelays(delaysRes || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Data loading failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "running":
        return "status-running";
      case "idle":
        return "status-idle";
      case "maintenance":
        return "status-maintenance";
      default:
        return "";
    }
  };

  const getRiskClass = (risk) => {
    switch (risk?.toUpperCase()) {
      case "HIGH":
        return "risk-high";
      case "MEDIUM":
        return "risk-medium";
      case "LOW":
        return "risk-low";
      default:
        return "";
    }
  };

  // Calculate summary stats
  const totalLines = linesOverview.length;
  const runningLines = linesOverview.filter(
    (l) => l.status?.toLowerCase() === "running",
  ).length;
  const averageOEE =
    oeeData.length > 0
      ? (
          (oeeData.reduce((sum, d) => sum + (d.oee || 0), 0) /
            oeeData.filter((d) => d.oee > 0).length || 0) * 100
        ).toFixed(1)
      : 0;
  const criticalDelays = delays.filter(
    (d) => d.risk?.toUpperCase() === "HIGH",
  ).length;

  // Prepare chart data from OEE
  const barChartData = oeeData.map((item) => ({
    name: item.line || "N/A",
    Availability: parseFloat(((item.availability || 0) * 100).toFixed(1)),
    Performance: parseFloat(((item.performance || 0) * 100).toFixed(1)),
    Quality: parseFloat(((item.quality || 0) * 100).toFixed(1)),
  }));

  // Calculate average availability & performance for donut charts
  const avgAvailability =
    oeeData.length > 0
      ? parseFloat(
          (
            (oeeData.reduce((sum, d) => sum + (d.availability || 0), 0) /
              oeeData.length) *
            100
          ).toFixed(1),
        )
      : 0;
  const avgPerformance =
    oeeData.length > 0
      ? parseFloat(
          (
            (oeeData.reduce((sum, d) => sum + (d.performance || 0), 0) /
              oeeData.length) *
            100
          ).toFixed(1),
        )
      : 0;

  const availabilityDonut = [
    { name: "Availability", value: avgAvailability },
    { name: "Remaining", value: 100 - avgAvailability },
  ];
  const performanceDonut = [
    { name: "Performance", value: avgPerformance },
    { name: "Remaining", value: 100 - avgPerformance },
  ];

  const DONUT_COLORS_1 = ["#4a6cf7", "#e8ecf1"];
  const DONUT_COLORS_2 = ["#36b58a", "#e8ecf1"];

  const renderCustomLabel = ({ cx, cy, value, name }) => {
    if (name === "Remaining") return null;
    return (
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: "22px", fontWeight: "800", fill: "#1a1a2e" }}
      >
        {value}%
      </text>
    );
  };

  return (
    <div className="manager-container">
      <ManagerSidebar />

      <main className="manager-main">
        {/* Top Header Bar */}
        <div className="top-header-bar">
          <div className="search-box">
            <svg className="search-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" placeholder="Search here..." />
          </div>
          <div className="header-actions">
            <button className="header-icon-btn" title="Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {criticalDelays > 0 && <span className="notification-dot" />}
            </button>
            <button className="header-icon-btn" title="Messages">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="notification-dot" />
            </button>
            <div className="header-avatar-wrapper">
              <div
                className="header-avatar"
                ref={avatarRef}
                title={currentUser?.fullName || "Manager"}
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              >
                {currentUser?.fullName?.charAt(0) || "M"}
              </div>
              {showUserDropdown && (
                <div className="user-dropdown" ref={dropdownRef}>
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-avatar">
                      {currentUser?.fullName?.charAt(0) || "M"}
                    </div>
                    <div className="user-dropdown-info">
                      <span className="user-dropdown-name">
                        {currentUser?.fullName || "Manager"}
                      </span>
                      <span className="user-dropdown-role">
                        Production Manager
                      </span>
                    </div>
                  </div>
                  <div className="user-dropdown-divider" />
                  <button className="user-dropdown-item" onClick={() => navigate("/manager/dashboard")}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    My Profile
                  </button>
                  <button className="user-dropdown-item" onClick={() => navigate("/manager/dashboard")}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    Settings
                  </button>
                  <div className="user-dropdown-divider" />
                  <button className="user-dropdown-item logout" onClick={handleLogout}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="page-content">
          {/* Page Title */}
          <div className="page-title-row">
            <div className="page-title-left">
              <h1>Dashboard</h1>
              <p>Overview of production activities</p>
            </div>
            <div className="header-controls">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-picker"
              />
              <button className="btn-refresh" onClick={fetchDashboardData}>
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-banner">
              <span>⚠️</span>
              <span>{error}</span>
              <button onClick={fetchDashboardData}>Retry</button>
            </div>
          )}

          {/* KPI Cards */}
          <section className="kpi-section">
            <div className="kpi-grid">
              <div className="kpi-card kpi-blue">
                <div className="kpi-card-top">
                  <span className="kpi-label">Lines Running</span>
                  <div className="kpi-icon">🏭</div>
                </div>
                <span className="kpi-value">
                  {runningLines}/{totalLines}
                </span>
                <span className="kpi-subtitle">Active production lines</span>
              </div>

              <div className="kpi-card kpi-green">
                <div className="kpi-card-top">
                  <span className="kpi-label">Average OEE</span>
                  <div className="kpi-icon">📈</div>
                </div>
                <span className="kpi-value">{averageOEE}%</span>
                <span className="kpi-subtitle">Overall equipment effectiveness</span>
              </div>

              <div className="kpi-card kpi-orange">
                <div className="kpi-card-top">
                  <span className="kpi-label">Critical Delays</span>
                  <div className="kpi-icon">⚠️</div>
                </div>
                <span className="kpi-value">{criticalDelays}</span>
                <span className="kpi-subtitle">Schedules at high risk</span>
              </div>

              <div className="kpi-card kpi-purple">
                <div className="kpi-card-top">
                  <span className="kpi-label">Operating Hours</span>
                  <div className="kpi-icon">⏰</div>
                </div>
                <span className="kpi-value">
                  {linesOverview
                    .reduce((sum, l) => sum + (l.busyHours || 0), 0)
                    .toFixed(1)}h
                </span>
                <span className="kpi-subtitle">Total hours today</span>
              </div>
            </div>
          </section>

          {/* Main Content Grid */}
          <div className="dashboard-grid">
            {/* === Charts Row (like reference image) === */}
            <section className="dashboard-card chart-bar-card">
              <div className="card-header">
                <div className="card-header-left">
                  <h2>
                    <span className="card-icon blue">📊</span>
                    OEE Breakdown by Line
                  </h2>
                  <span className="card-subtitle">
                    Avg. OEE {averageOEE}%
                  </span>
                </div>
                <div className="chart-filter-group">
                  <button className="chart-filter-btn active">Daily</button>
                  <button className="chart-filter-btn">Weekly</button>
                </div>
              </div>
              <div className="card-content chart-content">
                {loading ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <span>Loading data...</span>
                  </div>
                ) : barChartData.length === 0 ? (
                  <div className="no-data">
                    <span className="no-data-icon">📭</span>
                    <span>No chart data available</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={barChartData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      barCategoryGap="22%"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#eef0f5"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#8a92a6" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#8a92a6" }}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "10px",
                          border: "1px solid #e8ecf1",
                          boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                          fontSize: "13px",
                        }}
                        formatter={(value) => [`${value}%`]}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                      />
                      <Bar
                        dataKey="Availability"
                        fill="#4a6cf7"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="Performance"
                        fill="#9b59f0"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="Quality"
                        fill="#36b58a"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            {/* Donut Charts */}
            <section className="dashboard-card donut-charts-card">
              <div className="donut-charts-row">
                {/* Availability Donut */}
                <div className="donut-chart-item">
                  <div className="donut-chart-header">
                    <h3>Avg. Availability</h3>
                  </div>
                  <div className="donut-chart-wrapper">
                    {loading ? (
                      <div className="loading-spinner small">
                        <div className="spinner"></div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={availabilityDonut}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            strokeWidth={0}
                            label={renderCustomLabel}
                            labelLine={false}
                          >
                            {availabilityDonut.map((entry, index) => (
                              <Cell
                                key={`cell-a-${index}`}
                                fill={DONUT_COLORS_1[index]}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="donut-chart-legend">
                    <div className="legend-item">
                      <span
                        className="legend-dot"
                        style={{ background: "#4a6cf7" }}
                      ></span>
                      <span>Available</span>
                    </div>
                    <div className="legend-item">
                      <span
                        className="legend-dot"
                        style={{ background: "#e8ecf1" }}
                      ></span>
                      <span>Downtime</span>
                    </div>
                  </div>
                </div>

                {/* Performance Donut */}
                <div className="donut-chart-item">
                  <div className="donut-chart-header">
                    <h3>Avg. Performance</h3>
                  </div>
                  <div className="donut-chart-wrapper">
                    {loading ? (
                      <div className="loading-spinner small">
                        <div className="spinner"></div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={performanceDonut}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            strokeWidth={0}
                            label={renderCustomLabel}
                            labelLine={false}
                          >
                            {performanceDonut.map((entry, index) => (
                              <Cell
                                key={`cell-p-${index}`}
                                fill={DONUT_COLORS_2[index]}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="donut-chart-legend">
                    <div className="legend-item">
                      <span
                        className="legend-dot"
                        style={{ background: "#36b58a" }}
                      ></span>
                      <span>Effective</span>
                    </div>
                    <div className="legend-item">
                      <span
                        className="legend-dot"
                        style={{ background: "#e8ecf1" }}
                      ></span>
                      <span>Loss</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            {/* Lines Overview */}
            <section className="dashboard-card lines-overview">
              <div className="card-header">
                <div className="card-header-left">
                  <h2>
                    <span className="card-icon blue">🏭</span>
                    Lines Overview
                  </h2>
                  <span className="card-subtitle">Operating status of production lines</span>
                </div>
                <span className="card-header-badge">{totalLines} Lines</span>
              </div>
              <div className="card-content">
                {loading ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <span>Loading data...</span>
                  </div>
                ) : linesOverview.length === 0 ? (
                  <div className="no-data">
                    <span className="no-data-icon">📭</span>
                    <span>No lines data available</span>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Line</th>
                        <th>Status</th>
                        <th>Operating Hours</th>
                        <th>Available Machines</th>
                        <th>Capacity Load</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linesOverview.map((line) => (
                        <tr key={line.lineId}>
                          <td className="line-name">{line.lineName}</td>
                          <td>
                            <span
                              className={`status-badge ${getStatusClass(line.status)}`}
                            >
                              {line.status}
                            </span>
                          </td>
                          <td>
                            {line.busyHours}h / {line.availableHours}h
                          </td>
                          <td>{line.availableMachines} machines</td>
                          <td>
                            <div className="capacity-cell">
                              <div className="capacity-bar">
                                <div
                                  className="capacity-fill"
                                  style={{
                                    width: `${((line.busyHours || 0) / (line.availableHours || 1)) * 100}%`,
                                  }}
                                />
                              </div>
                              <span className="capacity-text">
                                {(
                                  ((line.busyHours || 0) /
                                    (line.availableHours || 1)) *
                                  100
                                ).toFixed(0)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Delays Alert */}
            <section className="dashboard-card delays-section">
              <div className="card-header">
                <div className="card-header-left">
                  <h2>
                    <span className="card-icon orange">⚠️</span>
                    Delay Alerts
                  </h2>
                  <span className="card-subtitle">Schedules at risk of delay</span>
                </div>
                {delays.length > 0 && (
                  <span className="card-header-badge">{delays.length} Alerts</span>
                )}
              </div>
              <div className="card-content">
                {loading ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <span>Loading data...</span>
                  </div>
                ) : delays.length === 0 ? (
                  <div className="no-data">
                    <span className="no-data-icon">✅</span>
                    <span>No delay alerts</span>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Schedule ID</th>
                        <th>Line</th>
                        <th>Machine</th>
                        <th>Expected</th>
                        <th>Actual</th>
                        <th>Delay</th>
                        <th>Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {delays.map((delay) => (
                        <tr key={delay.scheduleId}>
                          <td>#{delay.scheduleId}</td>
                          <td>{delay.line}</td>
                          <td>{delay.machine}</td>
                          <td>{delay.expected}</td>
                          <td>{delay.actual}</td>
                          <td className="delay-value">-{delay.delay}</td>
                          <td>
                            <span
                              className={`risk-badge ${getRiskClass(delay.risk)}`}
                            >
                              {delay.risk}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
