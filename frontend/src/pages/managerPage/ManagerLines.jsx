import React, { useState, useEffect } from "react";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import managerService from "../../services/managerService";
import "./ManagerLines.css";

const ManagerLines = () => {
  const [linesOverview, setLinesOverview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);

  useEffect(() => {
    fetchLinesData();
  }, []);

  const fetchLinesData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await managerService.getLinesOverview();
      setLinesOverview(response || []);
    } catch (error) {
      console.error("Error fetching lines:", error);
      setError("Unable to load data. Please try again later.");
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
      case "warning":
        return "status-warning";
      default:
        return "";
    }
  };

  const getEfficiencyClass = (efficiency) => {
    if (efficiency >= 85) return "efficiency-high";
    if (efficiency >= 60) return "efficiency-medium";
    if (efficiency > 0) return "efficiency-low";
    return "efficiency-none";
  };

  const handleLineClick = (line) => {
    setSelectedLine(selectedLine?.lineId === line.lineId ? null : line);
  };

  return (
    <div className="manager-container">
      <ManagerSidebar />

      <main className="manager-main">
        {/* Header */}
        <header className="manager-header">
          <div className="header-left">
            <h1>🏭 Production Line Management</h1>
            <p>Monitor and manage production lines</p>
          </div>
          <div className="header-right">
            <button className="btn-refresh" onClick={fetchLinesData}>
              🔄 Refresh
            </button>
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button onClick={fetchLinesData}>Retry</button>
          </div>
        )}

        {/* Summary Cards */}
        <section className="lines-summary">
          <div className="summary-card">
            <div className="summary-icon running">🟢</div>
            <div className="summary-content">
              <span className="summary-value">
                {
                  linesOverview.filter(
                    (l) => l.status?.toLowerCase() === "running",
                  ).length
                }
              </span>
              <span className="summary-label">Running</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon idle">⚪</div>
            <div className="summary-content">
              <span className="summary-value">
                {
                  linesOverview.filter(
                    (l) => l.status?.toLowerCase() === "idle",
                  ).length
                }
              </span>
              <span className="summary-label">Idle</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon maintenance">🟡</div>
            <div className="summary-content">
              <span className="summary-value">
                {
                  linesOverview.filter(
                    (l) => l.status?.toLowerCase() === "maintenance",
                  ).length
                }
              </span>
              <span className="summary-label">Maintenance</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon total">🏭</div>
            <div className="summary-content">
              <span className="summary-value">{linesOverview.length}</span>
              <span className="summary-label">Total Lines</span>
            </div>
          </div>
        </section>

        {/* Lines Grid */}
        <section className="lines-grid">
          {loading ? (
            <div className="loading-spinner">Loading...</div>
          ) : linesOverview.length === 0 ? (
            <div className="no-data">
              <span className="no-data-icon">📭</span>
              <span>No lines data available</span>
            </div>
          ) : (
            linesOverview.map((line) => (
              <div
                key={line.lineId}
                className={`line-card ${selectedLine?.lineId === line.lineId ? "expanded" : ""}`}
                onClick={() => handleLineClick(line)}
              >
                <div className="line-card-header">
                  <div className="line-info">
                    <span className="line-name">{line.lineName}</span>
                    <span
                      className={`status-badge ${getStatusClass(line.status)}`}
                    >
                      {line.status}
                    </span>
                  </div>
                  <span className="expand-icon">
                    {selectedLine?.lineId === line.lineId ? "▼" : "▶"}
                  </span>
                </div>

                <div className="line-metrics">
                  <div className="metric">
                    <span className="metric-label">Operating Hours</span>
                    <span className="metric-value">
                      {line.busyHours || 0}h / {line.availableHours || 8}h
                    </span>
                    <div className="metric-bar">
                      <div
                        className="metric-fill"
                        style={{
                          width: `${((line.busyHours || 0) / (line.availableHours || 8)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Available Machines</span>
                    <span className="metric-value">
                      {line.availableMachines || 0}
                    </span>
                  </div>
                </div>

                {line.currentOrder && (
                  <div className="line-current-order">
                    <span className="current-order-label">Current Order:</span>
                    <span className="current-order-id">
                      #{line.currentOrder}
                    </span>
                  </div>
                )}

                {line.targetToday > 0 && (
                  <div className="line-progress">
                    <div className="progress-header">
                      <span>Today's Progress</span>
                      <span>
                        {(line.completedToday || 0).toLocaleString()} /{" "}
                        {(line.targetToday || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${((line.completedToday || 0) / (line.targetToday || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Expanded Content - Machines */}
                {selectedLine?.lineId === line.lineId && line.machines && (
                  <div className="line-machines">
                    <h4>Machine List</h4>
                    <div className="machines-list">
                      {line.machines.map((machine) => (
                        <div key={machine.id} className="machine-item">
                          <div className="machine-info">
                            <span className="machine-name">{machine.name}</span>
                            <span
                              className={`machine-status ${getStatusClass(machine.status)}`}
                            >
                              {machine.status}
                            </span>
                          </div>
                          <div className="machine-efficiency">
                            <span className="efficiency-label">
                              Efficiency:
                            </span>
                            <span
                              className={`efficiency-value ${getEfficiencyClass(machine.efficiency)}`}
                            >
                              {machine.efficiency || 0}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {line.supervisor && (
                      <div className="line-supervisor">
                        <span className="supervisor-label">👤 Supervisor:</span>
                        <span className="supervisor-name">
                          {line.supervisor}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
};

export default ManagerLines;
