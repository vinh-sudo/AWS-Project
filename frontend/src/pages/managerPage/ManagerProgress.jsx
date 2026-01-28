import React, { useState } from "react";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import authService from "../../services/authService";
import "./ManagerProgress.css";

const ManagerProgress = () => {
  const currentUser = authService.getCurrentUser();
  const [filterLine, setFilterLine] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Sample production progress data
  const [progressData] = useState([
    {
      id: "PROG-001",
      orderId: "ORD-001",
      productName: "PCB-A100 Main Board",
      lineId: "LINE-SMT-01",
      lineName: "SMT Line 1",
      leader: "John Leader",
      startDate: "2026-01-20",
      targetDate: "2026-01-25",
      targetQuantity: 5000,
      completedQuantity: 3500,
      status: "on-track",
      efficiency: 92,
      defectRate: 1.2,
      workers: 12,
    },
    {
      id: "PROG-002",
      orderId: "ORD-002",
      productName: "PCB-B200 Controller",
      lineId: "LINE-SMT-02",
      lineName: "SMT Line 2",
      leader: "Mary Smith",
      startDate: "2026-01-18",
      targetDate: "2026-01-28",
      targetQuantity: 3000,
      completedQuantity: 1800,
      status: "delayed",
      efficiency: 75,
      defectRate: 2.5,
      workers: 10,
    },
    {
      id: "PROG-003",
      orderId: "ORD-003",
      productName: "PCB-C300 Sensor Module",
      lineId: "LINE-ASM-01",
      lineName: "Assembly Line 1",
      leader: "David Brown",
      startDate: "2026-01-15",
      targetDate: "2026-01-22",
      targetQuantity: 8000,
      completedQuantity: 7200,
      status: "on-track",
      efficiency: 88,
      defectRate: 0.8,
      workers: 15,
    },
    {
      id: "PROG-004",
      orderId: "ORD-004",
      productName: "PCB-D400 Power Supply",
      lineId: "LINE-TST-01",
      lineName: "Test Line 1",
      leader: "Sarah Wilson",
      startDate: "2026-01-22",
      targetDate: "2026-01-30",
      targetQuantity: 2500,
      completedQuantity: 800,
      status: "at-risk",
      efficiency: 65,
      defectRate: 3.1,
      workers: 8,
    },
  ]);

  const getProgressPercentage = (completed, target) => {
    return Math.round((completed / target) * 100);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "on-track":
        return "status-ontrack";
      case "delayed":
        return "status-delayed";
      case "at-risk":
        return "status-atrisk";
      case "completed":
        return "status-completed";
      default:
        return "";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "on-track":
        return "On Track";
      case "delayed":
        return "Delayed";
      case "at-risk":
        return "At Risk";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };

  const filteredData = () => {
    let data = progressData;
    if (filterLine !== "all") {
      data = data.filter((p) => p.lineId === filterLine);
    }
    if (filterStatus !== "all") {
      data = data.filter((p) => p.status === filterStatus);
    }
    return data;
  };

  // Summary stats
  const totalOrders = progressData.length;
  const onTrackOrders = progressData.filter(
    (p) => p.status === "on-track",
  ).length;
  const delayedOrders = progressData.filter(
    (p) => p.status === "delayed",
  ).length;
  const atRiskOrders = progressData.filter(
    (p) => p.status === "at-risk",
  ).length;
  const avgEfficiency = Math.round(
    progressData.reduce((acc, p) => acc + p.efficiency, 0) /
      progressData.length,
  );

  return (
    <div className="manager-progress-container">
      <ManagerSidebar />

      <main className="manager-progress-main">
        {/* Header */}
        <header className="progress-header">
          <div className="header-left">
            <div className="header-title">
              <h1>Progress Tracking</h1>
              <p>Monitor production progress across all lines</p>
            </div>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">
                {currentUser?.fullName || "Manager"}
              </span>
              <span className="user-role">Manager</span>
            </div>
          </div>
        </header>

        {/* Summary Cards */}
        <section className="summary-section">
          <div className="summary-cards">
            <div className="summary-card total">
              <div className="card-icon">📦</div>
              <div className="card-content">
                <span className="card-value">{totalOrders}</span>
                <span className="card-label">Total Orders</span>
              </div>
            </div>
            <div className="summary-card ontrack">
              <div className="card-icon">✅</div>
              <div className="card-content">
                <span className="card-value">{onTrackOrders}</span>
                <span className="card-label">On Track</span>
              </div>
            </div>
            <div className="summary-card delayed">
              <div className="card-icon">⏰</div>
              <div className="card-content">
                <span className="card-value">{delayedOrders}</span>
                <span className="card-label">Delayed</span>
              </div>
            </div>
            <div className="summary-card atrisk">
              <div className="card-icon">⚠️</div>
              <div className="card-content">
                <span className="card-value">{atRiskOrders}</span>
                <span className="card-label">At Risk</span>
              </div>
            </div>
            <div className="summary-card efficiency">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <span className="card-value">{avgEfficiency}%</span>
                <span className="card-label">Avg Efficiency</span>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Filter by Line:</label>
            <select
              value={filterLine}
              onChange={(e) => setFilterLine(e.target.value)}
            >
              <option value="all">All Lines</option>
              <option value="LINE-SMT-01">SMT Line 1</option>
              <option value="LINE-SMT-02">SMT Line 2</option>
              <option value="LINE-ASM-01">Assembly Line 1</option>
              <option value="LINE-TST-01">Test Line 1</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Filter by Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="on-track">On Track</option>
              <option value="delayed">Delayed</option>
              <option value="at-risk">At Risk</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Progress Cards */}
        <section className="progress-section">
          <div className="progress-grid">
            {filteredData().map((item) => (
              <div key={item.id} className="progress-card">
                <div className="progress-card-header">
                  <div className="order-info">
                    <h3 className="order-id">{item.orderId}</h3>
                    <span className="product-name">{item.productName}</span>
                  </div>
                  <span
                    className={`progress-status ${getStatusClass(item.status)}`}
                  >
                    {getStatusLabel(item.status)}
                  </span>
                </div>

                <div className="progress-card-body">
                  <div className="progress-bar-section">
                    <div className="progress-header-row">
                      <span className="progress-label">
                        Production Progress
                      </span>
                      <span className="progress-percentage">
                        {getProgressPercentage(
                          item.completedQuantity,
                          item.targetQuantity,
                        )}
                        %
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${getStatusClass(item.status)}`}
                        style={{
                          width: `${getProgressPercentage(item.completedQuantity, item.targetQuantity)}%`,
                        }}
                      ></div>
                    </div>
                    <div className="progress-details">
                      <span>
                        {item.completedQuantity.toLocaleString()} /{" "}
                        {item.targetQuantity.toLocaleString()} units
                      </span>
                    </div>
                  </div>

                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Line</span>
                      <span className="info-value">{item.lineName}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Leader</span>
                      <span className="info-value">{item.leader}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Start Date</span>
                      <span className="info-value">{item.startDate}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Target Date</span>
                      <span className="info-value">{item.targetDate}</span>
                    </div>
                  </div>

                  <div className="metrics-section">
                    <div className="metric">
                      <span className="metric-label">Efficiency</span>
                      <span
                        className={`metric-value ${item.efficiency >= 85 ? "good" : item.efficiency >= 70 ? "medium" : "low"}`}
                      >
                        {item.efficiency}%
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Defect Rate</span>
                      <span
                        className={`metric-value ${item.defectRate <= 1 ? "good" : item.defectRate <= 2 ? "medium" : "low"}`}
                      >
                        {item.defectRate}%
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Workers</span>
                      <span className="metric-value">{item.workers}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ManagerProgress;
