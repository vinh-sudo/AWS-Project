import React, { useState, useEffect } from "react";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import managerService from "../../services/managerService";
import "./ManagerTracking.css";

const ManagerTracking = () => {
  const [ganttData, setGanttData] = useState([]);
  const [oeeData, setOeeData] = useState([]);
  const [delays, setDelays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [activeTab, setActiveTab] = useState("gantt");

  useEffect(() => {
    fetchTrackingData();
  }, [selectedDate]);

  const fetchTrackingData = async () => {
    setLoading(true);
    try {
      const [ganttRes, oeeRes, delaysRes] = await Promise.all([
        managerService.getGantt(selectedDate).catch(() => mockGanttData),
        managerService.getOEE(selectedDate).catch(() => mockOeeData),
        managerService.getDelays().catch(() => mockDelays),
      ]);

      setGanttData(ganttRes);
      setOeeData(oeeRes);
      setDelays(delaysRes);
    } catch (error) {
      console.error("Error fetching tracking data:", error);
      setGanttData(mockGanttData);
      setOeeData(mockOeeData);
      setDelays(mockDelays);
    } finally {
      setLoading(false);
    }
  };

  // Mock data
  const mockGanttData = [
    {
      scheduleId: 1,
      line: "SMT Line 1",
      machine: "Pick & Place A1",
      orderId: 1,
      start: "2026-02-04T08:00:00+07:00",
      end: "2026-02-04T12:00:00+07:00",
      status: "COMPLETED",
    },
    {
      scheduleId: 2,
      line: "SMT Line 1",
      machine: "Reflow Oven R1",
      orderId: 1,
      start: "2026-02-04T12:30:00+07:00",
      end: "2026-02-04T17:00:00+07:00",
      status: "IN_PROGRESS",
    },
    {
      scheduleId: 3,
      line: "SMT Line 2",
      machine: "Pick & Place A2",
      orderId: 2,
      start: "2026-02-04T08:00:00+07:00",
      end: "2026-02-04T14:00:00+07:00",
      status: "IN_PROGRESS",
    },
    {
      scheduleId: 4,
      line: "SMT Line 2",
      machine: "AOI Inspector",
      orderId: 2,
      start: "2026-02-04T14:30:00+07:00",
      end: "2026-02-04T18:00:00+07:00",
      status: "PENDING",
    },
    {
      scheduleId: 5,
      line: "Assembly Line 1",
      machine: "Assembly Station 1",
      orderId: 3,
      start: "2026-02-04T09:00:00+07:00",
      end: "2026-02-04T16:00:00+07:00",
      status: "DELAYED",
    },
    {
      scheduleId: 6,
      line: "Test Line 1",
      machine: "Test Station 1",
      orderId: 1,
      start: "2026-02-04T13:00:00+07:00",
      end: "2026-02-04T17:30:00+07:00",
      status: "PENDING",
    },
  ];

  const mockOeeData = [
    {
      line: "SMT Line 1",
      availability: 92,
      performance: 88,
      quality: 98,
      oee: 79.5,
    },
    {
      line: "SMT Line 2",
      availability: 85,
      performance: 82,
      quality: 96,
      oee: 66.9,
    },
    {
      line: "Assembly Line 1",
      availability: 78,
      performance: 75,
      quality: 94,
      oee: 55.0,
    },
    {
      line: "Test Line 1",
      availability: 90,
      performance: 85,
      quality: 99,
      oee: 75.7,
    },
  ];

  const mockDelays = [
    {
      scheduleId: 5,
      line: "Assembly Line 1",
      machine: "Assembly Station 1",
      expected: 500,
      actual: 350,
      delay: 150,
      risk: "HIGH",
    },
    {
      scheduleId: 3,
      line: "SMT Line 2",
      machine: "Pick & Place A2",
      expected: 600,
      actual: 520,
      delay: 80,
      risk: "MEDIUM",
    },
    {
      scheduleId: 6,
      line: "Test Line 1",
      machine: "Test Station 1",
      expected: 400,
      actual: 380,
      delay: 20,
      risk: "LOW",
    },
  ];

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return "status-completed";
      case "IN_PROGRESS":
        return "status-progress";
      case "PENDING":
        return "status-pending";
      case "DELAYED":
        return "status-delayed";
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
    if (oee >= 85) return "oee-excellent";
    if (oee >= 65) return "oee-good";
    if (oee >= 40) return "oee-fair";
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

  // Time slots for header
  const timeSlots = Array.from({ length: 13 }, (_, i) => i + 7);

  return (
    <div className="manager-container">
      <ManagerSidebar />

      <main className="manager-main">
        {/* Header */}
        <header className="manager-header">
          <div className="header-left">
            <h1>📈 Theo dõi tiến độ sản xuất</h1>
            <p>Giám sát realtime hoạt động sản xuất</p>
          </div>
          <div className="header-right">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-picker"
            />
          </div>
        </header>

        {/* Tabs */}
        <div className="tracking-tabs">
          <button
            className={`tab-btn ${activeTab === "gantt" ? "active" : ""}`}
            onClick={() => setActiveTab("gantt")}
          >
            📊 Gantt Chart
          </button>
          <button
            className={`tab-btn ${activeTab === "oee" ? "active" : ""}`}
            onClick={() => setActiveTab("oee")}
          >
            📈 OEE Analysis
          </button>
          <button
            className={`tab-btn ${activeTab === "delays" ? "active" : ""}`}
            onClick={() => setActiveTab("delays")}
          >
            ⚠️ Delays ({delays.length})
          </button>
        </div>

        {/* Content */}
        <div className="tracking-content">
          {/* Gantt Chart */}
          {activeTab === "gantt" && (
            <section className="tracking-card gantt-section">
              <div className="card-header">
                <h2>📊 Gantt Chart - Lịch sản xuất</h2>
                <span className="card-subtitle">
                  Ngày: {new Date(selectedDate).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className="card-content">
                {loading ? (
                  <div className="loading-spinner">Đang tải...</div>
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
                      {Object.entries(ganttByLine).map(([line, items]) => (
                        <div key={line} className="gantt-line-group">
                          <div className="gantt-line-header">{line}</div>
                          {items.map((item) => (
                            <div key={item.scheduleId} className="gantt-row">
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
                                  title={`${item.machine}\n${new Date(item.start).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - ${new Date(item.end).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}\nStatus: ${item.status}`}
                                >
                                  <span className="bar-label">
                                    {item.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Legend */}
                    <div className="gantt-legend">
                      <div className="legend-item">
                        <span className="legend-color status-completed"></span>
                        <span>Hoàn thành</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-color status-progress"></span>
                        <span>Đang chạy</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-color status-pending"></span>
                        <span>Chờ</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-color status-delayed"></span>
                        <span>Trễ</span>
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
                <h2>📈 OEE Analysis</h2>
                <span className="card-subtitle">
                  Overall Equipment Effectiveness theo Line
                </span>
              </div>
              <div className="card-content">
                {loading ? (
                  <div className="loading-spinner">Đang tải...</div>
                ) : (
                  <>
                    {/* OEE Summary */}
                    <div className="oee-summary">
                      <div className="oee-summary-card">
                        <span className="oee-summary-value">
                          {(
                            oeeData.reduce((sum, d) => sum + d.oee, 0) /
                            oeeData.length
                          ).toFixed(1)}
                          %
                        </span>
                        <span className="oee-summary-label">
                          OEE Trung bình
                        </span>
                      </div>
                      <div className="oee-summary-card">
                        <span className="oee-summary-value">
                          {(
                            oeeData.reduce(
                              (sum, d) => sum + d.availability,
                              0,
                            ) / oeeData.length
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
                            oeeData.reduce((sum, d) => sum + d.performance, 0) /
                            oeeData.length
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
                            oeeData.reduce((sum, d) => sum + d.quality, 0) /
                            oeeData.length
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
                            <span className="oee-detail-line">{item.line}</span>
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
                                  strokeDasharray={`${item.oee * 1.26} 126`}
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
                                {item.oee.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="oee-detail-metrics">
                            <div className="metric-row">
                              <span className="metric-label">Availability</span>
                              <div className="metric-bar-container">
                                <div
                                  className="metric-bar availability"
                                  style={{ width: `${item.availability}%` }}
                                />
                              </div>
                              <span className="metric-value">
                                {item.availability}%
                              </span>
                            </div>
                            <div className="metric-row">
                              <span className="metric-label">Performance</span>
                              <div className="metric-bar-container">
                                <div
                                  className="metric-bar performance"
                                  style={{ width: `${item.performance}%` }}
                                />
                              </div>
                              <span className="metric-value">
                                {item.performance}%
                              </span>
                            </div>
                            <div className="metric-row">
                              <span className="metric-label">Quality</span>
                              <div className="metric-bar-container">
                                <div
                                  className="metric-bar quality"
                                  style={{ width: `${item.quality}%` }}
                                />
                              </div>
                              <span className="metric-value">
                                {item.quality}%
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
                <h2>⚠️ Cảnh báo trễ tiến độ</h2>
                <span className="card-subtitle">
                  Các schedule đang có nguy cơ trễ deadline
                </span>
              </div>
              <div className="card-content">
                {loading ? (
                  <div className="loading-spinner">Đang tải...</div>
                ) : delays.length === 0 ? (
                  <div className="no-data">
                    <span className="no-data-icon">✅</span>
                    <span>Không có cảnh báo trễ tiến độ</span>
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
                            <span className="delay-metric-label">Dự kiến</span>
                            <span className="delay-metric-value">
                              {delay.expected}
                            </span>
                          </div>
                          <div className="delay-metric">
                            <span className="delay-metric-label">Thực tế</span>
                            <span className="delay-metric-value actual">
                              {delay.actual}
                            </span>
                          </div>
                          <div className="delay-metric">
                            <span className="delay-metric-label">Thiếu</span>
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
                                width: `${(delay.actual / delay.expected) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="delay-progress-text">
                            {((delay.actual / delay.expected) * 100).toFixed(0)}
                            % hoàn thành
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
      </main>
    </div>
  );
};

export default ManagerTracking;
