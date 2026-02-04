import React, { useState, useEffect } from "react";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import managerService from "../../services/managerService";
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

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDate]);

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
      setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

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

  const getOEEClass = (oee) => {
    if (oee >= 85) return "oee-excellent";
    if (oee >= 65) return "oee-good";
    if (oee >= 40) return "oee-fair";
    return "oee-poor";
  };

  // Calculate summary stats
  const totalLines = linesOverview.length;
  const runningLines = linesOverview.filter(
    (l) => l.status?.toLowerCase() === "running",
  ).length;
  const averageOEE =
    oeeData.length > 0
      ? (
          oeeData.reduce((sum, d) => sum + (d.oee || 0), 0) /
            oeeData.filter((d) => d.oee > 0).length || 0
        ).toFixed(1)
      : 0;
  const criticalDelays = delays.filter(
    (d) => d.risk?.toUpperCase() === "HIGH",
  ).length;

  return (
    <div className="manager-container">
      <ManagerSidebar />

      <main className="manager-main">
        {/* Header */}
        <header className="manager-header">
          <div className="header-left">
            <h1>📊 Manager Dashboard</h1>
            <p>Tổng quan hoạt động sản xuất</p>
          </div>
          <div className="header-right">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-picker"
            />
            <button className="btn-refresh" onClick={fetchDashboardData}>
              🔄 Làm mới
            </button>
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button onClick={fetchDashboardData}>Thử lại</button>
          </div>
        )}

        {/* KPI Cards */}
        <section className="kpi-section">
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon">🏭</div>
              <div className="kpi-content">
                <span className="kpi-value">
                  {runningLines}/{totalLines}
                </span>
                <span className="kpi-label">Lines đang chạy</span>
              </div>
            </div>

            <div className="kpi-card success">
              <div className="kpi-icon">📈</div>
              <div className="kpi-content">
                <span className="kpi-value">{averageOEE}%</span>
                <span className="kpi-label">OEE trung bình</span>
              </div>
            </div>

            <div className={`kpi-card ${criticalDelays > 0 ? "warning" : ""}`}>
              <div className="kpi-icon">⚠️</div>
              <div className="kpi-content">
                <span className="kpi-value">{criticalDelays}</span>
                <span className="kpi-label">Cảnh báo trễ tiến độ</span>
              </div>
            </div>

            <div className="kpi-card highlight">
              <div className="kpi-icon">⏰</div>
              <div className="kpi-content">
                <span className="kpi-value">
                  {linesOverview
                    .reduce((sum, l) => sum + (l.busyHours || 0), 0)
                    .toFixed(1)}
                  h
                </span>
                <span className="kpi-label">Giờ hoạt động hôm nay</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="dashboard-grid">
          {/* Lines Overview */}
          <section className="dashboard-card lines-overview">
            <div className="card-header">
              <h2>🏭 Tổng quan Lines</h2>
              <span className="card-subtitle">
                Trạng thái hoạt động các dây chuyền
              </span>
            </div>
            <div className="card-content">
              {loading ? (
                <div className="loading-spinner">Đang tải...</div>
              ) : linesOverview.length === 0 ? (
                <div className="no-data">
                  <span className="no-data-icon">📭</span>
                  <span>Chưa có dữ liệu lines</span>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Line</th>
                      <th>Trạng thái</th>
                      <th>Giờ hoạt động</th>
                      <th>Máy khả dụng</th>
                      <th>Tải công suất</th>
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
                        <td>{line.availableMachines} máy</td>
                        <td>
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* OEE Chart */}
          <section className="dashboard-card oee-section">
            <div className="card-header">
              <h2>📈 OEE theo Line</h2>
              <span className="card-subtitle">
                Overall Equipment Effectiveness
              </span>
            </div>
            <div className="card-content">
              {loading ? (
                <div className="loading-spinner">Đang tải...</div>
              ) : oeeData.length === 0 ? (
                <div className="no-data">
                  <span className="no-data-icon">📭</span>
                  <span>Chưa có dữ liệu OEE</span>
                </div>
              ) : (
                <div className="oee-grid">
                  {oeeData.map((item, index) => (
                    <div
                      key={index}
                      className={`oee-card ${getOEEClass(item.oee)}`}
                    >
                      <div className="oee-header">
                        <span className="oee-line">{item.line}</span>
                        <span className="oee-value">
                          {(item.oee || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="oee-breakdown">
                        <div className="oee-item">
                          <span className="oee-item-label">Availability</span>
                          <div className="oee-item-bar">
                            <div
                              className="oee-item-fill availability"
                              style={{ width: `${item.availability || 0}%` }}
                            />
                          </div>
                          <span className="oee-item-value">
                            {item.availability || 0}%
                          </span>
                        </div>
                        <div className="oee-item">
                          <span className="oee-item-label">Performance</span>
                          <div className="oee-item-bar">
                            <div
                              className="oee-item-fill performance"
                              style={{ width: `${item.performance || 0}%` }}
                            />
                          </div>
                          <span className="oee-item-value">
                            {item.performance || 0}%
                          </span>
                        </div>
                        <div className="oee-item">
                          <span className="oee-item-label">Quality</span>
                          <div className="oee-item-bar">
                            <div
                              className="oee-item-fill quality"
                              style={{ width: `${item.quality || 0}%` }}
                            />
                          </div>
                          <span className="oee-item-value">
                            {item.quality || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Delays Alert */}
          <section className="dashboard-card delays-section">
            <div className="card-header">
              <h2>⚠️ Cảnh báo trễ tiến độ</h2>
              <span className="card-subtitle">Các schedule có nguy cơ trễ</span>
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
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Schedule ID</th>
                      <th>Line</th>
                      <th>Machine</th>
                      <th>Dự kiến</th>
                      <th>Thực tế</th>
                      <th>Trễ</th>
                      <th>Mức độ</th>
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
      </main>
    </div>
  );
};

export default ManagerDashboard;
