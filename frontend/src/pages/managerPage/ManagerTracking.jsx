import React, { useState, useEffect } from "react";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import ManagerTopBar from "./ManagerTopBar";
import managerService from "../../services/managerService";
import PageLoading from "../../components/PageLoading/PageLoading";
import "./ManagerTracking.css";

const ManagerTracking = () => {
  const [ganttData, setGanttData] = useState([]);
  const [oeeData, setOeeData] = useState([]);
  const [delays, setDelays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [activeTab, setActiveTab] = useState("gantt");

  useEffect(() => {
    fetchTrackingData();
  }, [selectedDate]);

  const fetchTrackingData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use Promise.allSettled so one failing API doesn't block the rest
      const [ganttRes, oeeRes, delaysRes] = await Promise.allSettled([
        managerService.getGantt(selectedDate),
        managerService.getOEE(selectedDate),
        managerService.getDelays(),
      ]);

      setGanttData(ganttRes.status === "fulfilled" ? ganttRes.value || [] : []);
      setOeeData(oeeRes.status === "fulfilled" ? oeeRes.value || [] : []);
      setDelays(delaysRes.status === "fulfilled" ? delaysRes.value || [] : []);

      // Collect partial errors
      const errors = [ganttRes, oeeRes, delaysRes]
        .filter((r) => r.status === "rejected")
        .map((r) => r.reason?.message || "Unknown error");
      if (errors.length > 0) {
        console.error("Partial tracking errors:", errors);
        if (errors.length === 3) {
          setError("Unable to load data. Please try again later.");
        }
      }
    } catch (error) {
      console.error("Error fetching tracking data:", error);
      setError("Unable to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "SCHEDULED":
        return "status-scheduled";
      case "RUNNING":
        return "status-running";
      case "PAUSED":
        return "status-paused";
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

  const getOEEClass = (oee) => {
    const oeePercent = (oee || 0) * 100;
    if (oeePercent >= 85) return "oee-excellent";
    if (oeePercent >= 65) return "oee-good";
    if (oeePercent >= 40) return "oee-fair";
    return "oee-poor";
  };

  // Parse time for Gantt chart
  const parseTime = (dateString) => {
    const date = new Date(dateString);
    return date.getHours() + date.getMinutes() / 60;
  };

  // Calculate bar position and width
  const getBarStyle = (start, end) => {
    const startHour = parseTime(start);
    const endHour = parseTime(end);
    const dayStart = 7; // 7 AM
    const dayEnd = 19; // 7 PM
    const totalHours = dayEnd - dayStart;

    const left = ((startHour - dayStart) / totalHours) * 100;
    const width = ((endHour - startHour) / totalHours) * 100;

    return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.min(100 - Math.max(0, left), width)}%`,
    };
  };

  // Group gantt data by line
  const ganttByLine = ganttData.reduce((acc, item) => {
    if (!acc[item.line]) {
      acc[item.line] = [];
    }
    acc[item.line].push(item);
    return acc;
  }, {});

  // Filter gantt data by search
  const filteredGanttByLine = Object.entries(ganttByLine).reduce(
    (acc, [line, items]) => {
      if (!searchTerm) {
        acc[line] = items;
      } else {
        const q = searchTerm.toLowerCase();
        if (
          line.toLowerCase().includes(q) ||
          items.some(
            (item) =>
              (item.machine || "").toLowerCase().includes(q) ||
              String(item.orderId).includes(q),
          )
        ) {
          acc[line] = items;
        }
      }
      return acc;
    },
    {},
  );

  // Time slots for header
  const timeSlots = Array.from({ length: 13 }, (_, i) => i + 7);

  return (
    <div className="manager-container">
      <ManagerSidebar />

      <main className="manager-main">
        {/* Top Bar - outside page-content, same as Dashboard */}
        <ManagerTopBar
          searchPlaceholder="Search lines, machines, schedules..."
          onSearch={(term) => setSearchTerm(term)}
        />

        <div className="page-content">
          {/* Page Title Row */}

          {/* Error Message */}
          {error && (
            <div className="error-banner">
              <span>⚠️</span>
              <span>{error}</span>
              <button onClick={fetchTrackingData}>Retry</button>
            </div>
          )}

          {/* KPI Cards */}
          <div className="tracking-kpi-grid">
            <div className="tracking-kpi-card kpi-blue">
              <div className="tracking-kpi-top">
                <span className="tracking-kpi-label">Active Lines</span>
                <div className="tracking-kpi-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 3h-8l-2 4h12z" />
                  </svg>
                </div>
              </div>
              <div className="tracking-kpi-value">
                {Object.keys(ganttByLine).length}
              </div>
              <div className="tracking-kpi-subtitle">Currently scheduled</div>
            </div>
            <div className="tracking-kpi-card kpi-green">
              <div className="tracking-kpi-top">
                <span className="tracking-kpi-label">Avg OEE</span>
                <div className="tracking-kpi-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
              </div>
              <div className="tracking-kpi-value">
                {oeeData.length > 0
                  ? (
                      (oeeData.reduce((sum, d) => sum + (d.oee || 0), 0) /
                        oeeData.length) *
                      100
                    ).toFixed(1) + "%"
                  : "—"}
              </div>
              <div className="tracking-kpi-subtitle">
                Equipment effectiveness
              </div>
            </div>
            <div className="tracking-kpi-card kpi-orange">
              <div className="tracking-kpi-top">
                <span className="tracking-kpi-label">Delays</span>
                <div className="tracking-kpi-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
              </div>
              <div className="tracking-kpi-value">{delays.length}</div>
              <div className="tracking-kpi-subtitle">Warnings detected</div>
            </div>
            <div className="tracking-kpi-card kpi-purple">
              <div className="tracking-kpi-top">
                <span className="tracking-kpi-label">Schedules</span>
                <div className="tracking-kpi-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
              </div>
              <div className="tracking-kpi-value">{ganttData.length}</div>
              <div className="tracking-kpi-subtitle">
                Today's schedule items
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tracking-tabs">
            <button
              className={`tab-btn ${activeTab === "gantt" ? "active" : ""}`}
              onClick={() => setActiveTab("gantt")}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              Gantt Chart
            </button>
            <button
              className={`tab-btn ${activeTab === "oee" ? "active" : ""}`}
              onClick={() => setActiveTab("oee")}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              OEE Analysis
            </button>
            <button
              className={`tab-btn ${activeTab === "delays" ? "active" : ""}`}
              onClick={() => setActiveTab("delays")}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Delays ({delays.length})
            </button>
          </div>

          {/* Content */}
          <div className="tracking-content">
            {/* Gantt Chart */}
            {activeTab === "gantt" && (
              <section className="tracking-card gantt-section">
                <div className="card-header">
                  <div className="card-header-left">
                    <h2>Gantt Chart - Production Schedule</h2>
                    <span className="card-subtitle">
                      Date: {new Date(selectedDate).toLocaleDateString("en-US")}
                    </span>
                  </div>
                  <span className="card-header-badge">
                    {ganttData.length} items
                  </span>
                </div>
                <div className="card-content">
                  {loading ? (
                    <PageLoading variant="inline" text="Loading schedule..." />
                  ) : Object.keys(filteredGanttByLine).length === 0 ? (
                    <div className="no-data">
                      <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#ccc"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>
                        {searchTerm
                          ? "No matching schedules"
                          : "No production schedule for this date"}
                      </span>
                    </div>
                  ) : (
                    <div className="gantt-container">
                      {/* Time Header */}
                      <div className="gantt-header">
                        <div className="gantt-line-label">Line / Machine</div>
                        <div className="gantt-timeline">
                          {timeSlots.map((hour) => (
                            <div key={hour} className="time-slot">
                              {hour}:00
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Gantt Rows */}
                      <div className="gantt-body">
                        {Object.entries(filteredGanttByLine).map(
                          ([line, items]) => (
                            <div key={line} className="gantt-line-group">
                              <div className="gantt-line-header">{line}</div>
                              {items.map((item) => (
                                <div
                                  key={item.scheduleId}
                                  className="gantt-row"
                                >
                                  <div className="gantt-row-label">
                                    <span className="machine-name">
                                      {item.machine}
                                    </span>
                                    <span className="order-id">
                                      #{item.orderId}
                                    </span>
                                  </div>
                                  <div className="gantt-row-timeline">
                                    <div className="gantt-grid">
                                      {timeSlots.map((hour) => (
                                        <div key={hour} className="grid-cell" />
                                      ))}
                                    </div>
                                    <div
                                      className={`gantt-bar ${getStatusClass(item.status)}`}
                                      style={getBarStyle(item.start, item.end)}
                                      title={`${item.machine}\n${new Date(item.start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} - ${new Date(item.end).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}\nStatus: ${item.status}`}
                                    >
                                      <span className="bar-label">
                                        {item.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ),
                        )}
                      </div>

                      {/* Legend */}
                      <div className="gantt-legend">
                        <div className="legend-item">
                          <span className="legend-color status-scheduled"></span>
                          <span>Scheduled</span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-color status-running"></span>
                          <span>Running</span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-color status-paused"></span>
                          <span>Paused</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* OEE Analysis */}
            {activeTab === "oee" && (
              <section className="tracking-card oee-analysis-section">
                <div className="card-header">
                  <div className="card-header-left">
                    <h2>
                      <span className="card-icon green">📈</span>
                      OEE Analysis
                    </h2>
                    <span className="card-subtitle">
                      Overall Equipment Effectiveness by Line
                    </span>
                  </div>
                  <span className="card-header-badge">
                    {oeeData.length} lines
                  </span>
                </div>
                <div className="card-content">
                  {loading ? (
                    <PageLoading variant="inline" text="Loading OEE data..." />
                  ) : oeeData.length === 0 ? (
                    <div className="no-data">
                      <span className="no-data-icon">📭</span>
                      <span>No OEE data available</span>
                    </div>
                  ) : (
                    <>
                      {/* OEE Summary */}
                      <div className="oee-summary">
                        <div className="oee-summary-card">
                          <span className="oee-summary-value">
                            {(
                              (oeeData.reduce(
                                (sum, d) => sum + (d.oee || 0),
                                0,
                              ) /
                                oeeData.length) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                          <span className="oee-summary-label">Average OEE</span>
                        </div>
                        <div className="oee-summary-card">
                          <span className="oee-summary-value">
                            {(
                              (oeeData.reduce(
                                (sum, d) => sum + (d.availability || 0),
                                0,
                              ) /
                                oeeData.length) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                          <span className="oee-summary-label">
                            Availability TB
                          </span>
                        </div>
                        <div className="oee-summary-card">
                          <span className="oee-summary-value">
                            {(
                              (oeeData.reduce(
                                (sum, d) => sum + (d.performance || 0),
                                0,
                              ) /
                                oeeData.length) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                          <span className="oee-summary-label">
                            Performance TB
                          </span>
                        </div>
                        <div className="oee-summary-card">
                          <span className="oee-summary-value">
                            {(
                              (oeeData.reduce(
                                (sum, d) => sum + (d.quality || 0),
                                0,
                              ) /
                                oeeData.length) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                          <span className="oee-summary-label">Quality TB</span>
                        </div>
                      </div>

                      {/* OEE Detail Cards */}
                      <div className="oee-detail-grid">
                        {oeeData.map((item, index) => (
                          <div
                            key={index}
                            className={`oee-detail-card ${getOEEClass(item.oee)}`}
                          >
                            <div className="oee-detail-header">
                              <span className="oee-detail-line">
                                {item.line}
                              </span>
                              <div className="oee-gauge">
                                <svg viewBox="0 0 100 50">
                                  <path
                                    d="M 10 50 A 40 40 0 0 1 90 50"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="8"
                                  />
                                  <path
                                    d="M 10 50 A 40 40 0 0 1 90 50"
                                    fill="none"
                                    stroke="url(#oeeGradient)"
                                    strokeWidth="8"
                                    strokeDasharray={`${(item.oee || 0) * 100 * 1.26} 126`}
                                  />
                                  <defs>
                                    <linearGradient
                                      id="oeeGradient"
                                      x1="0%"
                                      y1="0%"
                                      x2="100%"
                                      y2="0%"
                                    >
                                      <stop offset="0%" stopColor="#667eea" />
                                      <stop offset="100%" stopColor="#764ba2" />
                                    </linearGradient>
                                  </defs>
                                </svg>
                                <span className="oee-gauge-value">
                                  {((item.oee || 0) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            <div className="oee-detail-metrics">
                              <div className="metric-row">
                                <span className="metric-label">
                                  Availability
                                </span>
                                <div className="metric-bar-container">
                                  <div
                                    className="metric-bar availability"
                                    style={{
                                      width: `${(item.availability || 0) * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="metric-value">
                                  {((item.availability || 0) * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="metric-row">
                                <span className="metric-label">
                                  Performance
                                </span>
                                <div className="metric-bar-container">
                                  <div
                                    className="metric-bar performance"
                                    style={{
                                      width: `${(item.performance || 0) * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="metric-value">
                                  {((item.performance || 0) * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="metric-row">
                                <span className="metric-label">Quality</span>
                                <div className="metric-bar-container">
                                  <div
                                    className="metric-bar quality"
                                    style={{
                                      width: `${(item.quality || 0) * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="metric-value">
                                  {((item.quality || 0) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </section>
            )}

            {/* Delays */}
            {activeTab === "delays" && (
              <section className="tracking-card delays-section">
                <div className="card-header">
                  <div className="card-header-left">
                    <h2>
                      <span className="card-icon orange">⚠️</span>
                      Delay Warnings
                    </h2>
                    <span className="card-subtitle">
                      Schedules at risk of missing deadlines
                    </span>
                  </div>
                  <span className="card-header-badge">
                    {delays.length} warnings
                  </span>
                </div>
                <div className="card-content">
                  {loading ? (
                    <PageLoading variant="inline" text="Loading delays..." />
                  ) : delays.length === 0 ? (
                    <div className="no-data">
                      <span className="no-data-icon">✅</span>
                      <span>No delay warnings</span>
                    </div>
                  ) : (
                    <div className="delays-grid">
                      {delays.map((delay) => (
                        <div
                          key={delay.scheduleId}
                          className={`delay-card ${getRiskClass(delay.risk)}`}
                        >
                          <div className="delay-header">
                            <span className="delay-schedule">
                              Schedule #{delay.scheduleId}
                            </span>
                            <span
                              className={`risk-badge ${getRiskClass(delay.risk)}`}
                            >
                              {delay.risk} RISK
                            </span>
                          </div>
                          <div className="delay-info">
                            <div className="delay-line">
                              <span className="delay-icon">🏭</span>
                              <span>{delay.line}</span>
                            </div>
                            <div className="delay-machine">
                              <span className="delay-icon">⚙️</span>
                              <span>{delay.machine}</span>
                            </div>
                          </div>
                          <div className="delay-metrics">
                            <div className="delay-metric">
                              <span className="delay-metric-label">
                                Expected
                              </span>
                              <span className="delay-metric-value">
                                {delay.expected}
                              </span>
                            </div>
                            <div className="delay-metric">
                              <span className="delay-metric-label">Actual</span>
                              <span className="delay-metric-value actual">
                                {delay.actual}
                              </span>
                            </div>
                            <div className="delay-metric">
                              <span className="delay-metric-label">
                                Shortfall
                              </span>
                              <span className="delay-metric-value delay-amount">
                                -{delay.delay}
                              </span>
                            </div>
                          </div>
                          <div className="delay-progress">
                            <div className="delay-progress-bar">
                              <div
                                className="delay-progress-fill"
                                style={{
                                  width: `${((delay.actual || 0) / (delay.expected || 1)) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="delay-progress-text">
                              {(
                                ((delay.actual || 0) / (delay.expected || 1)) *
                                100
                              ).toFixed(0)}
                              % completed
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerTracking;
