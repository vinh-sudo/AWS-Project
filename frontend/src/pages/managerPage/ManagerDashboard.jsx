import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import ManagerTopBar from "./ManagerTopBar";
import managerService from "../../services/managerService";
import authService from "../../services/authService";
import PageLoading from "../../components/PageLoading/PageLoading";
import "./ManagerDashboard.css";

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
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDelays, setFilteredDelays] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const currentUser = authService.getCurrentUser();
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
        setShowExportMenu(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const toPercent = (raw) => {
    const num = Number(raw);
    if (!Number.isFinite(num)) return 0;
    return num <= 1 ? num * 100 : num;
  };

  const achievementRate = Number(
    toPercent(productionOverview?.achievementRate).toFixed(1)
  );

  const criticalDelays = delays.filter(
    (d) => d.risk?.toUpperCase() === "HIGH"
  ).length;
  const totalOperatingHours = linesOverview
    .reduce((sum, l) => sum + (l.busyHours || 0), 0)
    .toFixed(1);

  const sortedLinesOverview = useMemo(() => {
    const rows = [...linesOverview];
    if (!sortConfig.key) return rows;

    rows.sort((a, b) => {
      const left = a[sortConfig.key];
      const right = b[sortConfig.key];

      if (left == null && right == null) return 0;
      if (left == null) return sortConfig.direction === "asc" ? -1 : 1;
      if (right == null) return sortConfig.direction === "asc" ? 1 : -1;

      if (typeof left === "number" && typeof right === "number") {
        return sortConfig.direction === "asc" ? left - right : right - left;
      }

      return sortConfig.direction === "asc"
        ? String(left).localeCompare(String(right))
        : String(right).localeCompare(String(left));
    });

    return rows;
  }, [linesOverview, sortConfig]);

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
              <select
                value={overviewRange}
                onChange={(e) => setOverviewRange(e.target.value)}
                className="date-picker"
                title="Production overview range"
              >
                <option value="TODAY">Today</option>
                <option value="WEEK">This Week</option>
                <option value="MONTH">This Month</option>
              </select>

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
                <span className="kpi-value">{achievementRate}%</span>
                <span className="kpi-subtitle">
                  {productionOverview
                    ? `${productionOverview.totalGood}/${productionOverview.totalTarget} good vs target`
                    : "Production achievement from backend"}
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
                <span className="kpi-subtitle">
                  {productionOverview
                    ? `Downtime: ${productionOverview.totalDowntimeMinutes || 0} min`
                    : "Total hours from lines overview"}
                </span>
              </div>
            </div>
          </section>

          {/* Main Content Grid */}
          <div className="dashboard-grid">
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
                      {sortedLinesOverview.map((line) => (
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
