import React, { useState, useEffect } from "react";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import managerService from "../../services/managerService";
import "./ManagerLines.css";

const ManagerLines = () => {
  const [linesOverview, setLinesOverview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedLine, setExpandedLine] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");

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
        return "ln-st-running";
      case "idle":
        return "ln-st-idle";
      case "maintenance":
        return "ln-st-maintenance";
      case "warning":
        return "ln-st-warning";
      default:
        return "";
    }
  };

  const getEfficiencyClass = (efficiency) => {
    if (efficiency >= 85) return "ln-eff-high";
    if (efficiency >= 60) return "ln-eff-mid";
    if (efficiency > 0) return "ln-eff-low";
    return "ln-eff-none";
  };

  const toggleLine = (lineId) => {
    setExpandedLine(expandedLine === lineId ? null : lineId);
  };

  const filteredLines = filterStatus
    ? linesOverview.filter(
        (l) => l.status?.toLowerCase() === filterStatus.toLowerCase()
      )
    : linesOverview;

  return (
    <div className="manager-container">
      <ManagerSidebar />

      <main className="manager-main">
        <div className="page-content">
          {/* ── Header ── */}
          <div className="ln-header">
            <div className="ln-header-left">
              <h1>Production Lines</h1>
              <p>Monitor status and capacity of all production lines</p>
            </div>
            <div className="ln-header-actions">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="ln-select"
              >
                <option value="">All Status</option>
                <option value="running">Running</option>
                <option value="idle">Idle</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <button className="ln-btn-refresh" onClick={fetchLinesData}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                Refresh
              </button>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="ln-error">
              <span>⚠️</span>
              <span>{error}</span>
              <button onClick={fetchLinesData}>Retry</button>
            </div>
          )}

          {/* ── Lines Table ── */}
          <section className="ln-panel">
            <div className="ln-panel-header">
              <h2>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4a6cf7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 3h-8l-2 4h12z"/></svg>
                All Lines
              </h2>
              <span className="ln-badge">{filteredLines.length} lines</span>
            </div>

            {loading ? (
              <div className="ln-loading">
                <div className="ln-spinner"></div>
                <span>Loading lines...</span>
              </div>
            ) : filteredLines.length === 0 ? (
              <div className="ln-empty">
                <span>📭</span>
                <span>No lines found</span>
              </div>
            ) : (
              <div className="ln-table-wrap">
                <table className="ln-table">
                  <thead>
                    <tr>
                      <th style={{ width: "32px" }}></th>
                      <th>Line</th>
                      <th>Status</th>
                      <th>Operating Hours</th>
                      <th>Machines</th>
                      <th>Current Order</th>
                      <th>Today's Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLines.map((line) => {
                      const isExpanded = expandedLine === line.lineId;
                      const utilization =
                        ((line.busyHours || 0) /
                          (line.availableHours || 8)) *
                        100;
                      const progressPct =
                        line.targetToday > 0
                          ? ((line.completedToday || 0) /
                              (line.targetToday || 1)) *
                            100
                          : 0;

                      return (
                        <React.Fragment key={line.lineId}>
                          <tr
                            className={`ln-row ${isExpanded ? "ln-row-active" : ""}`}
                            onClick={() => toggleLine(line.lineId)}
                          >
                            <td className="ln-cell-toggle">
                              <span
                                className={`ln-chevron ${isExpanded ? "ln-chevron-open" : ""}`}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                              </span>
                            </td>
                            <td className="ln-cell-name">{line.lineName}</td>
                            <td>
                              <span
                                className={`ln-status ${getStatusClass(line.status)}`}
                              >
                                {line.status || "N/A"}
                              </span>
                            </td>
                            <td>
                              <div className="ln-hours">
                                <span className="ln-hours-text">
                                  {line.busyHours || 0}h / {line.availableHours || 8}h
                                </span>
                                <div className="ln-bar">
                                  <div
                                    className="ln-bar-fill"
                                    style={{ width: `${Math.min(utilization, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="ln-cell-num">
                              {line.availableMachines || 0}
                            </td>
                            <td>
                              {line.currentOrder ? (
                                <span className="ln-order-tag">
                                  #{line.currentOrder}
                                </span>
                              ) : (
                                <span className="ln-cell-muted">—</span>
                              )}
                            </td>
                            <td>
                              {line.targetToday > 0 ? (
                                <div className="ln-progress">
                                  <div className="ln-progress-bar">
                                    <div
                                      className="ln-progress-fill"
                                      style={{ width: `${Math.min(progressPct, 100)}%` }}
                                    />
                                  </div>
                                  <span className="ln-progress-text">
                                    {(line.completedToday || 0).toLocaleString()}/
                                    {(line.targetToday || 0).toLocaleString()}
                                  </span>
                                </div>
                              ) : (
                                <span className="ln-cell-muted">—</span>
                              )}
                            </td>
                          </tr>

                          {/* Expanded row: Machine details */}
                          {isExpanded && (
                            <tr className="ln-expand-row">
                              <td colSpan="7">
                                <div className="ln-expand-content">
                                  {line.machines && line.machines.length > 0 ? (
                                    <div className="ln-machines-section">
                                      <h4>Machines</h4>
                                      <div className="ln-machines-grid">
                                        {line.machines.map((machine) => (
                                          <div
                                            key={machine.id}
                                            className="ln-machine-item"
                                          >
                                            <div className="ln-machine-left">
                                              <span className="ln-machine-name">
                                                {machine.name}
                                              </span>
                                              <span
                                                className={`ln-status ln-status-sm ${getStatusClass(machine.status)}`}
                                              >
                                                {machine.status}
                                              </span>
                                            </div>
                                            <div className="ln-machine-eff">
                                              <span className="ln-eff-label">Eff</span>
                                              <span
                                                className={`ln-eff-value ${getEfficiencyClass(machine.efficiency)}`}
                                              >
                                                {machine.efficiency || 0}%
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="ln-no-machines">
                                      No machine data available
                                    </div>
                                  )}
                                  {line.supervisor && (
                                    <div className="ln-supervisor">
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a92a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                      <span className="ln-sup-label">Supervisor:</span>
                                      <span className="ln-sup-name">{line.supervisor}</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default ManagerLines;
