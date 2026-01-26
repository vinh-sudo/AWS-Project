import React, { useState } from "react";
import authService from "../../services/authService";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import "./Reports.css";

const Reports = () => {
  const currentUser = authService.getCurrentUser();

  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("week");

  // Mock KPI Data
  const kpiData = {
    oee: { current: 78.5, target: 85, trend: "+2.3%" },
    onTimeDelivery: { current: 94.2, target: 98, trend: "+1.1%" },
    qualityRate: { current: 99.1, target: 99.5, trend: "+0.3%" },
    productivity: { current: 1250, target: 1500, trend: "+5.2%" },
    defectRate: { current: 0.9, target: 0.5, trend: "-0.2%" },
    efficiency: { current: 82, target: 90, trend: "+3.5%" },
  };

  // Production Summary Data
  const productionSummary = [
    { date: "Mon", completed: 4500, target: 5000, defects: 45 },
    { date: "Tue", completed: 4800, target: 5000, defects: 38 },
    { date: "Wed", completed: 5200, target: 5000, defects: 52 },
    { date: "Thu", completed: 4200, target: 5000, defects: 35 },
    { date: "Fri", completed: 4900, target: 5000, defects: 41 },
    { date: "Sat", completed: 3500, target: 4000, defects: 28 },
    { date: "Sun", completed: 2800, target: 3000, defects: 22 },
  ];

  // Line Performance Data
  const linePerformance = [
    {
      line: "SMT Line 1",
      oee: 85,
      availability: 92,
      performance: 88,
      quality: 99.2,
      status: "Excellent",
    },
    {
      line: "SMT Line 2",
      oee: 72,
      availability: 85,
      performance: 80,
      quality: 98.5,
      status: "Good",
    },
    {
      line: "Assembly Line 1",
      oee: 68,
      availability: 78,
      performance: 82,
      quality: 99.0,
      status: "Fair",
    },
    {
      line: "Test Line 1",
      oee: 60,
      availability: 70,
      performance: 80,
      quality: 99.5,
      status: "Needs Improvement",
    },
  ];

  // Order Report Data
  const orderReport = [
    {
      id: "ORD-001",
      product: "PCB-A100",
      ordered: 5000,
      completed: 3200,
      remaining: 1800,
      status: "On Track",
      dueDate: "2025-01-25",
    },
    {
      id: "ORD-002",
      product: "PCB-B200",
      ordered: 3000,
      completed: 3000,
      remaining: 0,
      status: "Completed",
      dueDate: "2025-01-20",
    },
    {
      id: "ORD-003",
      product: "PCB-C300",
      ordered: 8000,
      completed: 2800,
      remaining: 5200,
      status: "At Risk",
      dueDate: "2025-01-28",
    },
    {
      id: "ORD-004",
      product: "PCB-D400",
      ordered: 2500,
      completed: 1500,
      remaining: 1000,
      status: "On Track",
      dueDate: "2025-01-30",
    },
    {
      id: "ORD-005",
      product: "PCB-E500",
      ordered: 6000,
      completed: 0,
      remaining: 6000,
      status: "Not Started",
      dueDate: "2025-02-05",
    },
  ];

  const getStatusClass = (status) => {
    switch (status) {
      case "Excellent":
      case "Completed":
      case "On Track":
        return "status-good";
      case "Good":
        return "status-ok";
      case "Fair":
      case "At Risk":
        return "status-warning";
      case "Needs Improvement":
      case "Not Started":
        return "status-poor";
      default:
        return "";
    }
  };

  const getTrendClass = (trend) => {
    return trend.startsWith("+") ? "trend-up" : "trend-down";
  };

  const exportToCSV = () => {
    alert("Exporting report to CSV...");
    // Implementation would go here
  };

  const exportToPDF = () => {
    alert("Exporting report to PDF...");
    // Implementation would go here
  };

  return (
    <div className="reports-container">
      {/* Sidebar */}
      <ManagerSidebar />

      {/* Main Content */}
      <main className="reports-main">
        {/* Header */}
        <header className="reports-header">
          <div className="header-left">
            <div className="header-title">
              <h1>Reports & Analytics</h1>
              <p>Comprehensive production insights and KPIs</p>
            </div>
          </div>
          <div className="header-right">
            <div className="date-filter">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <div className="export-buttons">
              <button className="btn-export csv" onClick={exportToCSV}>
                📄 CSV
              </button>
              <button className="btn-export pdf" onClick={exportToPDF}>
                📑 PDF
              </button>
            </div>
            <div className="user-info">
              <span className="user-name">
                {currentUser?.fullName || "Manager"}
              </span>
              <span className="user-role">Manager</span>
            </div>
          </div>
        </header>

        {/* Horizontal Tabs */}
        <div className="reports-tabs">
          <button
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            📊 Overview
          </button>
          <button
            className={`tab-btn ${activeTab === "lines" ? "active" : ""}`}
            onClick={() => setActiveTab("lines")}
          >
            📈 Line Performance
          </button>
          <button
            className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            📋 Order Report
          </button>
          <button
            className={`tab-btn ${activeTab === "quality" ? "active" : ""}`}
            onClick={() => setActiveTab("quality")}
          >
            ✅ Quality Report
          </button>
        </div>

        {/* KPI Cards */}
        {activeTab === "overview" && (
          <section className="kpi-section">
            <h2 className="section-title">Key Performance Indicators</h2>
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-header">
                  <span className="kpi-icon">⚙️</span>
                  <span
                    className={`kpi-trend ${getTrendClass(kpiData.oee.trend)}`}
                  >
                    {kpiData.oee.trend}
                  </span>
                </div>
                <div className="kpi-info">
                  <div className="kpi-value">{kpiData.oee.current}%</div>
                  <div className="kpi-label">Overall OEE</div>
                </div>
                <div className="kpi-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(kpiData.oee.current / kpiData.oee.target) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="kpi-target">
                    Target: {kpiData.oee.target}%
                  </span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <span className="kpi-icon">🚚</span>
                  <span
                    className={`kpi-trend ${getTrendClass(kpiData.onTimeDelivery.trend)}`}
                  >
                    {kpiData.onTimeDelivery.trend}
                  </span>
                </div>
                <div className="kpi-info">
                  <div className="kpi-value">
                    {kpiData.onTimeDelivery.current}%
                  </div>
                  <div className="kpi-label">On-Time Delivery</div>
                </div>
                <div className="kpi-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(kpiData.onTimeDelivery.current / kpiData.onTimeDelivery.target) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="kpi-target">
                    Target: {kpiData.onTimeDelivery.target}%
                  </span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <span className="kpi-icon">✅</span>
                  <span
                    className={`kpi-trend ${getTrendClass(kpiData.qualityRate.trend)}`}
                  >
                    {kpiData.qualityRate.trend}
                  </span>
                </div>
                <div className="kpi-info">
                  <div className="kpi-value">
                    {kpiData.qualityRate.current}%
                  </div>
                  <div className="kpi-label">Quality Rate</div>
                </div>
                <div className="kpi-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill quality"
                      style={{
                        width: `${(kpiData.qualityRate.current / kpiData.qualityRate.target) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="kpi-target">
                    Target: {kpiData.qualityRate.target}%
                  </span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <span className="kpi-icon">📦</span>
                  <span
                    className={`kpi-trend ${getTrendClass(kpiData.productivity.trend)}`}
                  >
                    {kpiData.productivity.trend}
                  </span>
                </div>
                <div className="kpi-info">
                  <div className="kpi-value">
                    {kpiData.productivity.current.toLocaleString()}
                  </div>
                  <div className="kpi-label">Units Produced</div>
                </div>
                <div className="kpi-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(kpiData.productivity.current / kpiData.productivity.target) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="kpi-target">
                    Target: {kpiData.productivity.target.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <span className="kpi-icon">⚠️</span>
                  <span
                    className={`kpi-trend ${kpiData.defectRate.trend.startsWith("-") ? "trend-up" : "trend-down"}`}
                  >
                    {kpiData.defectRate.trend}
                  </span>
                </div>
                <div className="kpi-info">
                  <div className="kpi-value">{kpiData.defectRate.current}%</div>
                  <div className="kpi-label">Defect Rate</div>
                </div>
                <div className="kpi-progress">
                  <div className="progress-bar inverse">
                    <div
                      className="progress-fill defect"
                      style={{
                        width: `${(kpiData.defectRate.current / 5) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="kpi-target">
                    Target: &lt;{kpiData.defectRate.target}%
                  </span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <span className="kpi-icon">⚡</span>
                  <span
                    className={`kpi-trend ${getTrendClass(kpiData.efficiency.trend)}`}
                  >
                    {kpiData.efficiency.trend}
                  </span>
                </div>
                <div className="kpi-info">
                  <div className="kpi-value">{kpiData.efficiency.current}%</div>
                  <div className="kpi-label">Efficiency</div>
                </div>
                <div className="kpi-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(kpiData.efficiency.current / kpiData.efficiency.target) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="kpi-target">
                    Target: {kpiData.efficiency.target}%
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Production Chart */}
        {(activeTab === "overview" || activeTab === "production") && (
          <section className="chart-section">
            <h2 className="section-title">
              Production Summary -{" "}
              {dateRange === "week" ? "This Week" : dateRange}
            </h2>
            <div className="chart-container">
              <div className="bar-chart">
                {productionSummary.map((day, index) => (
                  <div key={index} className="chart-column">
                    <div className="bar-group">
                      <div
                        className="bar completed"
                        style={{ height: `${(day.completed / 6000) * 200}px` }}
                        title={`Completed: ${day.completed}`}
                      >
                        <span className="bar-value">{day.completed}</span>
                      </div>
                      <div
                        className="bar target"
                        style={{ height: `${(day.target / 6000) * 200}px` }}
                        title={`Target: ${day.target}`}
                      ></div>
                    </div>
                    <span className="chart-label">{day.date}</span>
                  </div>
                ))}
              </div>
              <div className="chart-legend">
                <span className="legend-item">
                  <span className="legend-color completed"></span> Completed
                </span>
                <span className="legend-item">
                  <span className="legend-color target"></span> Target
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Line Performance Table */}
        {(activeTab === "overview" || activeTab === "lines") && (
          <section className="table-section">
            <h2 className="section-title">Line Performance Analysis</h2>
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Production Line</th>
                    <th>OEE (%)</th>
                    <th>Availability (%)</th>
                    <th>Performance (%)</th>
                    <th>Quality (%)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {linePerformance.map((line, index) => (
                    <tr key={index}>
                      <td className="line-name">{line.line}</td>
                      <td>
                        <div className="cell-with-bar">
                          <span>{line.oee}</span>
                          <div className="mini-bar">
                            <div
                              className="mini-fill"
                              style={{
                                width: `${line.oee}%`,
                                background:
                                  line.oee >= 80
                                    ? "#4caf50"
                                    : line.oee >= 60
                                      ? "#ff9800"
                                      : "#f44336",
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td>{line.availability}</td>
                      <td>{line.performance}</td>
                      <td>{line.quality}</td>
                      <td>
                        <span
                          className={`status-badge ${getStatusClass(line.status)}`}
                        >
                          {line.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Order Report Table */}
        {(activeTab === "overview" || activeTab === "orders") && (
          <section className="table-section">
            <h2 className="section-title">Order Fulfillment Report</h2>
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Product</th>
                    <th>Ordered</th>
                    <th>Completed</th>
                    <th>Remaining</th>
                    <th>Progress</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orderReport.map((order, index) => (
                    <tr key={index}>
                      <td className="order-id">{order.id}</td>
                      <td>{order.product}</td>
                      <td>{order.ordered.toLocaleString()}</td>
                      <td>{order.completed.toLocaleString()}</td>
                      <td>{order.remaining.toLocaleString()}</td>
                      <td>
                        <div className="progress-cell">
                          <div className="progress-bar-mini">
                            <div
                              className="progress-fill-mini"
                              style={{
                                width: `${(order.completed / order.ordered) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span>
                            {Math.round(
                              (order.completed / order.ordered) * 100,
                            )}
                            %
                          </span>
                        </div>
                      </td>
                      <td>{order.dueDate}</td>
                      <td>
                        <span
                          className={`status-badge ${getStatusClass(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Quality Report */}
        {activeTab === "quality" && (
          <section className="quality-section">
            <h2 className="section-title">Quality Analysis Report</h2>
            <div className="quality-grid">
              <div className="quality-card">
                <h3>Defect Distribution by Type</h3>
                <div className="defect-list">
                  <div className="defect-item">
                    <span className="defect-name">Solder Bridge</span>
                    <div className="defect-bar">
                      <div
                        className="defect-fill"
                        style={{ width: "35%" }}
                      ></div>
                    </div>
                    <span className="defect-percent">35%</span>
                  </div>
                  <div className="defect-item">
                    <span className="defect-name">Missing Component</span>
                    <div className="defect-bar">
                      <div
                        className="defect-fill"
                        style={{ width: "25%" }}
                      ></div>
                    </div>
                    <span className="defect-percent">25%</span>
                  </div>
                  <div className="defect-item">
                    <span className="defect-name">Wrong Polarity</span>
                    <div className="defect-bar">
                      <div
                        className="defect-fill"
                        style={{ width: "18%" }}
                      ></div>
                    </div>
                    <span className="defect-percent">18%</span>
                  </div>
                  <div className="defect-item">
                    <span className="defect-name">Insufficient Solder</span>
                    <div className="defect-bar">
                      <div
                        className="defect-fill"
                        style={{ width: "12%" }}
                      ></div>
                    </div>
                    <span className="defect-percent">12%</span>
                  </div>
                  <div className="defect-item">
                    <span className="defect-name">Other</span>
                    <div className="defect-bar">
                      <div
                        className="defect-fill"
                        style={{ width: "10%" }}
                      ></div>
                    </div>
                    <span className="defect-percent">10%</span>
                  </div>
                </div>
              </div>

              <div className="quality-card">
                <h3>Quality Metrics by Line</h3>
                <div className="quality-metrics">
                  {linePerformance.map((line, index) => (
                    <div key={index} className="metric-item">
                      <span className="metric-line">{line.line}</span>
                      <div className="metric-value-container">
                        <span className="metric-value">{line.quality}%</span>
                        <span
                          className={`metric-status ${line.quality >= 99 ? "good" : line.quality >= 98 ? "ok" : "poor"}`}
                        >
                          {line.quality >= 99
                            ? "✓"
                            : line.quality >= 98
                              ? "!"
                              : "✗"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="quality-card wide">
                <h3>Quality Trend (Last 7 Days)</h3>
                <div className="trend-chart">
                  {[99.0, 98.8, 99.2, 99.1, 98.9, 99.3, 99.1].map(
                    (value, index) => (
                      <div key={index} className="trend-point">
                        <div
                          className="trend-bar"
                          style={{ height: `${(value - 97) * 50}px` }}
                        >
                          <span className="trend-value">{value}%</span>
                        </div>
                        <span className="trend-label">Day {index + 1}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Reports;
