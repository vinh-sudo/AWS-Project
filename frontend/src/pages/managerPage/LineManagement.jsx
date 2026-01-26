import React, { useState } from "react";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import authService from "../../services/authService";
import "./LineManagement.css";

const LineManagement = () => {
  const currentUser = authService.getCurrentUser();
  const [activeTab, setActiveTab] = useState("all");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLine, setSelectedLine] = useState(null);

  // Production Lines data
  const [lines] = useState([
    {
      id: "LINE-SMT-01",
      name: "SMT Line 1",
      type: "SMT",
      capacity: 5000,
      currentLoad: 3500,
      status: "Running",
      efficiency: 92,
      leader: "John Leader",
      leaderId: "LD001",
      workers: 12,
      currentOrder: "ORD-001",
      currentProduct: "PCB-A100",
      lastMaintenance: "2026-01-15",
      nextMaintenance: "2026-02-15",
    },
    {
      id: "LINE-SMT-02",
      name: "SMT Line 2",
      type: "SMT",
      capacity: 4500,
      currentLoad: 3000,
      status: "Running",
      efficiency: 85,
      leader: "Mary Smith",
      leaderId: "LD002",
      workers: 10,
      currentOrder: "ORD-002",
      currentProduct: "PCB-B200",
      lastMaintenance: "2026-01-10",
      nextMaintenance: "2026-02-10",
    },
    {
      id: "LINE-ASM-01",
      name: "Assembly Line 1",
      type: "Assembly",
      capacity: 8000,
      currentLoad: 6800,
      status: "Running",
      efficiency: 88,
      leader: "David Brown",
      leaderId: "LD003",
      workers: 15,
      currentOrder: "ORD-003",
      currentProduct: "PCB-C300",
      lastMaintenance: "2026-01-05",
      nextMaintenance: "2026-02-05",
    },
    {
      id: "LINE-TST-01",
      name: "Test Line 1",
      type: "Testing",
      capacity: 3000,
      currentLoad: 0,
      status: "Idle",
      efficiency: 0,
      leader: "Sarah Wilson",
      leaderId: "LD004",
      workers: 8,
      currentOrder: null,
      currentProduct: null,
      lastMaintenance: "2026-01-20",
      nextMaintenance: "2026-02-20",
    },
    {
      id: "LINE-SMT-03",
      name: "SMT Line 3",
      type: "SMT",
      capacity: 5000,
      currentLoad: 0,
      status: "Maintenance",
      efficiency: 0,
      leader: "Tom Wilson",
      leaderId: "LD005",
      workers: 12,
      currentOrder: null,
      currentProduct: null,
      lastMaintenance: "2026-01-25",
      nextMaintenance: "2026-01-27",
    },
  ]);

  const getStatusClass = (status) => {
    switch (status) {
      case "Running":
        return "status-running";
      case "Idle":
        return "status-idle";
      case "Maintenance":
        return "status-maintenance";
      default:
        return "";
    }
  };

  const getUtilization = (current, capacity) => {
    return Math.round((current / capacity) * 100);
  };

  const filteredLines = () => {
    if (activeTab === "all") return lines;
    if (activeTab === "running") return lines.filter((l) => l.status === "Running");
    if (activeTab === "idle") return lines.filter((l) => l.status === "Idle");
    if (activeTab === "maintenance") return lines.filter((l) => l.status === "Maintenance");
    return lines;
  };

  const openDetailModal = (line) => {
    setSelectedLine(line);
    setShowDetailModal(true);
  };

  // Summary stats
  const totalLines = lines.length;
  const runningLines = lines.filter((l) => l.status === "Running").length;
  const idleLines = lines.filter((l) => l.status === "Idle").length;
  const maintenanceLines = lines.filter((l) => l.status === "Maintenance").length;
  const avgEfficiency = Math.round(
    lines.filter((l) => l.status === "Running").reduce((acc, l) => acc + l.efficiency, 0) / runningLines || 0
  );

  return (
    <div className="line-management-container">
      <ManagerSidebar />

      <main className="line-management-main">
        {/* Header */}
        <header className="line-management-header">
          <div className="header-left">
            <div className="header-title">
              <h1>Production Lines</h1>
              <p>Monitor and manage all production lines</p>
            </div>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{currentUser?.fullName || "Manager"}</span>
              <span className="user-role">Manager</span>
            </div>
          </div>
        </header>

        {/* Summary Cards */}
        <section className="summary-section">
          <div className="summary-cards">
            <div className="summary-card total">
              <div className="card-icon">🏭</div>
              <div className="card-content">
                <span className="card-value">{totalLines}</span>
                <span className="card-label">Total Lines</span>
              </div>
            </div>
            <div className="summary-card running">
              <div className="card-icon">✅</div>
              <div className="card-content">
                <span className="card-value">{runningLines}</span>
                <span className="card-label">Running</span>
              </div>
            </div>
            <div className="summary-card idle">
              <div className="card-icon">⏸️</div>
              <div className="card-content">
                <span className="card-value">{idleLines}</span>
                <span className="card-label">Idle</span>
              </div>
            </div>
            <div className="summary-card maintenance">
              <div className="card-icon">🔧</div>
              <div className="card-content">
                <span className="card-value">{maintenanceLines}</span>
                <span className="card-label">Maintenance</span>
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

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Lines ({totalLines})
          </button>
          <button
            className={`tab-btn ${activeTab === "running" ? "active" : ""}`}
            onClick={() => setActiveTab("running")}
          >
            Running ({runningLines})
          </button>
          <button
            className={`tab-btn ${activeTab === "idle" ? "active" : ""}`}
            onClick={() => setActiveTab("idle")}
          >
            Idle ({idleLines})
          </button>
          <button
            className={`tab-btn ${activeTab === "maintenance" ? "active" : ""}`}
            onClick={() => setActiveTab("maintenance")}
          >
            Maintenance ({maintenanceLines})
          </button>
        </div>

        {/* Lines Grid */}
        <section className="lines-section">
          <div className="lines-grid">
            {filteredLines().map((line) => (
              <div key={line.id} className="line-card">
                <div className="line-card-header">
                  <div className="line-info">
                    <h3 className="line-name">{line.name}</h3>
                    <span className="line-type">{line.type}</span>
                  </div>
                  <span className={`line-status ${getStatusClass(line.status)}`}>
                    {line.status}
                  </span>
                </div>

                <div className="line-card-body">
                  {line.status === "Running" && (
                    <>
                      <div className="line-stat">
                        <span className="stat-label">Current Order</span>
                        <span className="stat-value">{line.currentOrder}</span>
                      </div>
                      <div className="line-stat">
                        <span className="stat-label">Product</span>
                        <span className="stat-value">{line.currentProduct}</span>
                      </div>
                    </>
                  )}

                  <div className="line-stat">
                    <span className="stat-label">Leader</span>
                    <span className="stat-value">{line.leader}</span>
                  </div>

                  <div className="line-stat">
                    <span className="stat-label">Workers</span>
                    <span className="stat-value">{line.workers}</span>
                  </div>

                  {line.status === "Running" && (
                    <div className="utilization-section">
                      <div className="utilization-header">
                        <span className="stat-label">Utilization</span>
                        <span className="utilization-value">
                          {getUtilization(line.currentLoad, line.capacity)}%
                        </span>
                      </div>
                      <div className="utilization-bar">
                        <div
                          className="utilization-fill"
                          style={{
                            width: `${getUtilization(line.currentLoad, line.capacity)}%`,
                          }}
                        ></div>
                      </div>
                      <div className="capacity-info">
                        {line.currentLoad.toLocaleString()} / {line.capacity.toLocaleString()} units
                      </div>
                    </div>
                  )}

                  {line.status === "Running" && (
                    <div className="efficiency-section">
                      <span className="stat-label">Efficiency</span>
                      <div className="efficiency-badge">
                        <span className={`efficiency-value ${line.efficiency >= 90 ? "high" : line.efficiency >= 70 ? "medium" : "low"}`}>
                          {line.efficiency}%
                        </span>
                      </div>
                    </div>
                  )}

                  {line.status === "Maintenance" && (
                    <div className="maintenance-info">
                      <span className="stat-label">Expected Ready</span>
                      <span className="stat-value">{line.nextMaintenance}</span>
                    </div>
                  )}
                </div>

                <div className="line-card-footer">
                  <button className="btn-detail" onClick={() => openDetailModal(line)}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Detail Modal */}
        {showDetailModal && selectedLine && (
          <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedLine.name} - Details</h2>
                <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Line ID</span>
                    <span className="detail-value">{selectedLine.id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Type</span>
                    <span className="detail-value">{selectedLine.type}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status</span>
                    <span className={`detail-value status-badge ${getStatusClass(selectedLine.status)}`}>
                      {selectedLine.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Capacity</span>
                    <span className="detail-value">{selectedLine.capacity.toLocaleString()} units/day</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Current Load</span>
                    <span className="detail-value">{selectedLine.currentLoad.toLocaleString()} units</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Efficiency</span>
                    <span className="detail-value">{selectedLine.efficiency}%</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Line Leader</span>
                    <span className="detail-value">{selectedLine.leader}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Workers</span>
                    <span className="detail-value">{selectedLine.workers}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Current Order</span>
                    <span className="detail-value">{selectedLine.currentOrder || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Current Product</span>
                    <span className="detail-value">{selectedLine.currentProduct || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Last Maintenance</span>
                    <span className="detail-value">{selectedLine.lastMaintenance}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Next Maintenance</span>
                    <span className="detail-value">{selectedLine.nextMaintenance}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LineManagement;
