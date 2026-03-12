import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import ManagerTopBar from "./ManagerTopBar";
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
import PageLoading from "../../components/PageLoading/PageLoading";
import "./ManagerDashboard.css";

// Animated counter hook
const useAnimatedValue = (targetValue, duration = 1000) => {
  const [value, setValue] = useState(0);
  const startTime = useRef(null);
  const animationFrame = useRef(null);

  useEffect(() => {
    startTime.current = Date.now();
    const startValue = 0;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (targetValue - startValue) * eased;
      setValue(current);

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };

    animationFrame.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [targetValue, duration]);

  return value;
};

const ManagerDashboard = () => {
  const [linesOverview, setLinesOverview] = useState([]);
  const [oeeData, setOeeData] = useState([]);
  const [delays, setDelays] = useState([]);
  const [productionOverview, setProductionOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [overviewRange, setOverviewRange] = useState("TODAY");

  // === NEW STATES ===
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("dashboard-dark-mode") === "true";
  });
  const [expandedChart, setExpandedChart] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDelays, setFilteredDelays] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const currentUser = authService.getCurrentUser();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const exportMenuRef = useRef(null);

  // === DARK MODE TOGGLE ===
  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("dashboard-dark-mode", darkMode);
  }, [darkMode]);

  // === SEARCH FILTER FOR DELAYS ===
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDelays(delays);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredDelays(
        delays.filter(
          (d) =>
            d.line?.toLowerCase().includes(query) ||
            d.machine?.toLowerCase().includes(query) ||
            d.risk?.toLowerCase().includes(query) ||
            String(d.scheduleId).includes(query)
        )
      );
    }
  }, [searchQuery, delays]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(e.target)
      ) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // === KEYBOARD SHORTCUTS ===
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        setDarkMode((prev) => !prev);
      }
      if (e.key === "Escape") {
        setExpandedChart(null);
        setShowExportMenu(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [linesRes, oeeRes, delaysRes, prodRes] = await Promise.allSettled([
        managerService.getLinesOverview(),
        managerService.getOEE(selectedDate),
        managerService.getDelays(),
        managerService.getProductionOverview(overviewRange),
      ]);

      setLinesOverview(
        linesRes.status === "fulfilled" ? linesRes.value || [] : []
      );
      setOeeData(oeeRes.status === "fulfilled" ? oeeRes.value || [] : []);
      setDelays(delaysRes.status === "fulfilled" ? delaysRes.value || [] : []);
      setProductionOverview(
        prodRes.status === "fulfilled" ? prodRes.value || null : null
      );

      const errors = [linesRes, oeeRes, delaysRes, prodRes]
        .filter((r) => r.status === "rejected")
        .map((r) => r.reason?.message || "Unknown error");
      if (errors.length > 0) {
        console.error("Partial dashboard errors:", errors);
        if (errors.length === 4) {
          setError("Data loading failed. Please try again later.");
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Data loading failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, overviewRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // === HELPER FUNCTIONS ===
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "OK":
      case "RUNNING":
        return "status-ok";
      case "TIGHT":
      case "IDLE":
        return "status-tight";
      case "OVERLOAD":
      case "MAINTENANCE":
        return "status-overload";
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

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  // === EXPORT FUNCTIONS ===
  const downloadCSV = (filename, headers, rows) => {
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportToCSV = () => {
    const headers = ["Line", "Status", "Busy Hours", "Available Hours", "Machines"];
    const rows = linesOverview.map((l) => [
      l.lineName, l.status, l.busyHours, l.availableHours, l.availableMachines,
    ]);
    downloadCSV("lines_overview.csv", headers, rows);
    setShowExportMenu(false);
  };

  const exportOEECSV = () => {
    const headers = ["Line", "Availability", "Performance", "Quality", "OEE"];
    const rows = oeeData.map((d) => [
      d.line,
      ((d.availability || 0) * 100).toFixed(1),
      ((d.performance || 0) * 100).toFixed(1),
      ((d.quality || 0) * 100).toFixed(1),
      ((d.oee || 0) * 100).toFixed(1),
    ]);
    downloadCSV("oee_report.csv", headers, rows);
    setShowExportMenu(false);
  };

  const exportDelaysCSV = () => {
    const headers = ["Schedule ID", "Line", "Machine", "Expected", "Actual", "Delay", "Risk"];
    const rows = delays.map((d) => [
      d.scheduleId, d.line, d.machine, d.expected, d.actual, d.delay, d.risk,
    ]);
    downloadCSV("delay_alerts.csv", headers, rows);
    setShowExportMenu(false);
  };

  // === COMPUTED VALUES ===
  const totalLines = linesOverview.length;
  const runningLines = linesOverview.filter(
    (l) => l.status?.toUpperCase() === "OK" || l.status?.toLowerCase() === "running"
  ).length;
  const idleLines = linesOverview.filter(
    (l) => l.status?.toLowerCase() === "idle"
  ).length;
  const maintenanceLines = linesOverview.filter(
    (l) => l.status?.toLowerCase() === "maintenance"
  ).length;
  const averageOEE =
    oeeData.length > 0
      ? (
          (oeeData.reduce((sum, d) => sum + (d.oee || 0), 0) /
            (oeeData.filter((d) => d.oee > 0).length || 1)) *
          100
        ).toFixed(1)
      : 0;
  const criticalDelays = delays.filter(
    (d) => d.risk?.toUpperCase() === "HIGH"
  ).length;
  const totalOperatingHours = linesOverview
    .reduce((sum, l) => sum + (l.busyHours || 0), 0)
    .toFixed(1);

  // Animated values
  const animatedOEE = useAnimatedValue(parseFloat(averageOEE), 1200);
  const animatedRunning = useAnimatedValue(runningLines, 800);
  const animatedDelays = useAnimatedValue(criticalDelays, 800);
  const animatedHours = useAnimatedValue(parseFloat(totalOperatingHours), 1000);

  // Chart data
  const barChartData = oeeData.map((item) => ({
    name: item.line || "N/A",
    Availability: parseFloat(((item.availability || 0) * 100).toFixed(1)),
    Performance: parseFloat(((item.performance || 0) * 100).toFixed(1)),
    Quality: parseFloat(((item.quality || 0) * 100).toFixed(1)),
    OEE: parseFloat(((item.oee || 0) * 100).toFixed(1)),
  }));

  // Donut chart data
  const avgAvailability =
    oeeData.length > 0
      ? parseFloat(
          ((oeeData.reduce((sum, d) => sum + (d.availability || 0), 0) / oeeData.length) * 100).toFixed(1)
        )
      : 0;
  const avgPerformance =
    oeeData.length > 0
      ? parseFloat(
          ((oeeData.reduce((sum, d) => sum + (d.performance || 0), 0) / oeeData.length) * 100).toFixed(1)
        )
      : 0;
  const avgQuality =
    oeeData.length > 0
      ? parseFloat(
          ((oeeData.reduce((sum, d) => sum + (d.quality || 0), 0) / oeeData.length) * 100).toFixed(1)
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
  const qualityDonut = [
    { name: "Quality", value: avgQuality },
    { name: "Remaining", value: 100 - avgQuality },
  ];

  const DONUT_COLORS_1 = ["#4a6cf7", "#e8ecf1"];
  const DONUT_COLORS_2 = ["#36b58a", "#e8ecf1"];
  const DONUT_COLORS_3 = ["#9b59f0", "#e8ecf1"];

  const renderCustomLabel = ({ cx, cy, value, name }) => {
    if (name === "Remaining") return null;
    return (
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: "22px", fontWeight: "800", fill: darkMode ? "#e0e0e0" : "#1a1a2e" }}
      >
        {value}%
      </text>
    );
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className={`manager-container ${darkMode ? "dark-mode" : ""}`}>
      <ManagerSidebar />

      <main className="manager-main">
        {/* Top Header Bar - shared component */}
        <ManagerTopBar
          searchPlaceholder="Search lines, machines, schedules..."
          onSearch={(term) => setSearchQuery(term)}
        />

        {/* Page Content */}
        <div className="page-content">
          {/* Page Title */}
          <div className="page-title-row">
            <div className="page-title-left">
              <h1>
                {getGreeting()},{" "}
                {currentUser?.fullName?.split(" ")[0] || "Manager"} 👋
              </h1>
              <p>
                {formatDate(new Date())} — Overview of production activities
              </p>
            </div>
            <div className="header-controls">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-picker"
              />

              {/* Export Button */}
              <div className="export-wrapper" ref={exportMenuRef}>
                <button
                  className="btn-export"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  title="Export Data"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export
                </button>
                {showExportMenu && (
                  <div className="export-dropdown">
                    <button onClick={exportToCSV}>
                      <span>📄</span> Lines Overview (CSV)
                    </button>
                    <button onClick={exportOEECSV}>
                      <span>📊</span> OEE Report (CSV)
                    </button>
                    <button onClick={exportDelaysCSV}>
                      <span>⚠️</span> Delay Alerts (CSV)
                    </button>
                  </div>
                )}
              </div>
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
                {totalLines > 0 && (
                  <div className="kpi-mini-bar">
                    <div
                      className="kpi-mini-fill"
                      style={{
                        width: `${(runningLines / totalLines) * 100}%`,
                        background: "#4a6cf7",
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="kpi-card kpi-green">
                <div className="kpi-card-top">
                  <span className="kpi-label">Achievement Rate</span>
                  <div className="kpi-icon">🎯</div>
                </div>
                <span className="kpi-value">{averageOEE}%</span>
                <span className="kpi-subtitle">
                  Overall equipment effectiveness
                </span>
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
                  <div className="kpi-icon">📈</div>
                </div>
                <span className="kpi-value">{totalOperatingHours}h</span>
                <span className="kpi-subtitle">Total hours today</span>
              </div>
            </div>
          </section>

          {/* Main Content Grid */}
          <div className="dashboard-grid">
            {/* === OEE Bar Chart === */}
            <section className="dashboard-card chart-bar-card">
              <div className="card-header">
                <div className="card-header-left">
                  <h2>
                    <span className="card-icon blue">📊</span>
                    OEE Breakdown by Line
                  </h2>
                  <span className="card-subtitle">Avg. OEE {averageOEE}%</span>
                </div>
              </div>
              <div className="card-content chart-content">
                {loading ? (
                  <PageLoading variant="inline" text="Loading data..." />
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
                        stroke={darkMode ? "#333" : "#eef0f5"}
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 12,
                          fill: darkMode ? "#999" : "#8a92a6",
                        }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 12,
                          fill: darkMode ? "#999" : "#8a92a6",
                        }}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "10px",
                          border: "1px solid #e8ecf1",
                          boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                          fontSize: "13px",
                          background: darkMode ? "#1e1e2e" : "#fff",
                          color: darkMode ? "#e0e0e0" : "#333",
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
                        animationDuration={1200}
                      />
                      <Bar
                        dataKey="Performance"
                        fill="#9b59f0"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1200}
                      />
                      <Bar
                        dataKey="Quality"
                        fill="#36b58a"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1200}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            {/* Donut Charts */}
            <section className="dashboard-card donut-charts-card">
              <div className="donut-charts-row">
                <div className="donut-chart-item">
                  <div className="donut-chart-header">
                    <h3>Avg. Availability</h3>
                  </div>
                  <div className="donut-chart-wrapper">
                    {loading ? (
                      <PageLoading variant="inline" text="" />
                    ) : (
                      <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                          <Pie
                            data={availabilityDonut}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={62}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            strokeWidth={0}
                            label={renderCustomLabel}
                            labelLine={false}
                            animationDuration={1200}
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

                <div className="donut-chart-item">
                  <div className="donut-chart-header">
                    <h3>Avg. Performance</h3>
                  </div>
                  <div className="donut-chart-wrapper">
                    {loading ? (
                      <PageLoading variant="inline" text="" />
                    ) : (
                      <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                          <Pie
                            data={performanceDonut}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={62}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            strokeWidth={0}
                            label={renderCustomLabel}
                            labelLine={false}
                            animationDuration={1200}
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

                <div className="donut-chart-item">
                  <div className="donut-chart-header">
                    <h3>Avg. Quality</h3>
                  </div>
                  <div className="donut-chart-wrapper">
                    {loading ? (
                      <PageLoading variant="inline" text="" />
                    ) : (
                      <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                          <Pie
                            data={qualityDonut}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={62}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            strokeWidth={0}
                            label={renderCustomLabel}
                            labelLine={false}
                            animationDuration={1200}
                          >
                            {qualityDonut.map((entry, index) => (
                              <Cell
                                key={`cell-q-${index}`}
                                fill={DONUT_COLORS_3[index]}
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
                        style={{ background: "#9b59f0" }}
                      ></span>
                      <span>Good</span>
                    </div>
                    <div className="legend-item">
                      <span
                        className="legend-dot"
                        style={{ background: "#e8ecf1" }}
                      ></span>
                      <span>Defect</span>
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
                  <span className="card-subtitle">
                    Operating status of production lines
                  </span>
                </div>
                <span className="card-header-badge">{totalLines} Lines</span>
              </div>
              <div className="card-content">
                {loading ? (
                  <PageLoading variant="inline" text="Loading data..." />
                ) : linesOverview.length === 0 ? (
                  <div className="no-data">
                    <span className="no-data-icon">📭</span>
                    <span>No lines data available</span>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th
                          onClick={() => handleSort("lineName")}
                          style={{ cursor: "pointer" }}
                        >
                          Line {getSortIcon("lineName")}
                        </th>
                        <th
                          onClick={() => handleSort("status")}
                          style={{ cursor: "pointer" }}
                        >
                          Status {getSortIcon("status")}
                        </th>
                        <th
                          onClick={() => handleSort("busyHours")}
                          style={{ cursor: "pointer" }}
                        >
                          Operating Hours {getSortIcon("busyHours")}
                        </th>
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
                                ).toFixed(0)}
                                %
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
                  <span className="card-subtitle">
                    Schedules at risk of delay
                  </span>
                </div>
                {delays.length > 0 && (
                  <span className="card-header-badge">
                    {delays.length} Alerts
                  </span>
                )}
              </div>
              <div className="card-content">
                {loading ? (
                  <PageLoading variant="inline" text="Loading data..." />
                ) : filteredDelays.length === 0 ? (
                  <div className="no-data">
                    <span className="no-data-icon">
                      {searchQuery ? "🔍" : "✅"}
                    </span>
                    <span>
                      {searchQuery
                        ? `No results for "${searchQuery}"`
                        : "No delay alerts"}
                    </span>
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
                      {filteredDelays.map((delay) => (
                        <tr
                          key={delay.scheduleId}
                          className={
                            delay.risk?.toUpperCase() === "HIGH"
                              ? "row-critical"
                              : ""
                          }
                        >
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
                              {delay.risk?.toUpperCase() === "HIGH" && "🔴 "}
                              {delay.risk?.toUpperCase() === "MEDIUM" && "🟡 "}
                              {delay.risk?.toUpperCase() === "LOW" && "🟢 "}
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

          {/* Footer */}
          <footer className="dashboard-footer">
            <div className="footer-left">
              <span>© 2026 Production Management System</span>
            </div>
            <div className="footer-right">
              <span className="footer-shortcut" title="Keyboard shortcuts">
                ⌨️ Ctrl+D: Dark Mode | Esc: Close
              </span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
