import React, { useState, useEffect } from "react";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import managerService from "../../services/managerService";
import "./ManagerLines.css";

const ManagerLines = () => {
  const [linesOverview, setLinesOverview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    switch (status?.toUpperCase()) {
      case "OK":
        return "status-ok";
      case "TIGHT":
        return "status-tight";
      case "OVERLOAD":
        return "status-overload";
      default:
        return "";
    }
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
            <NotificationBell />
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
            <div className="summary-icon ok">🟢</div>
            <div className="summary-content">
              <span className="summary-value">
                {
                  linesOverview.filter((l) => l.status?.toUpperCase() === "OK")
                    .length
                }
              </span>
              <span className="summary-label">OK</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon tight">🟡</div>
            <div className="summary-content">
              <span className="summary-value">
                {
                  linesOverview.filter(
                    (l) => l.status?.toUpperCase() === "TIGHT",
                  ).length
                }
              </span>
              <span className="summary-label">Tight</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon overload">🔴</div>
            <div className="summary-content">
              <span className="summary-value">
                {
                  linesOverview.filter(
                    (l) => l.status?.toUpperCase() === "OVERLOAD",
                  ).length
                }
              </span>
              <span className="summary-label">Overload</span>
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
              <div key={line.lineId} className="line-card">
                <div className="line-card-header">
                  <div className="line-info">
                    <span className="line-name">{line.lineName}</span>
                    <span
                      className={`status-badge ${getStatusClass(line.status)}`}
                    >
                      {line.status}
                    </span>
                  </div>
                  <span className="line-status-text">{line.status}</span>
                </div>

                <div className="line-metrics">
                  <div className="metric">
                    <span className="metric-label">Operating Hours</span>
                    <span className="metric-value">
                      {(line.busyHours || 0).toFixed(1)}h /{" "}
                      {(line.availableHours || 0).toFixed(1)}h
                    </span>
                    <div className="metric-bar">
                      <div
                        className="metric-fill"
                        style={{
                          width: `${((line.busyHours || 0) / (line.availableHours || 1)) * 100}%`,
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
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
};

export default ManagerLines;
