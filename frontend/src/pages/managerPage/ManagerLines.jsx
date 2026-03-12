import React, { useState, useEffect, useMemo } from "react";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import ManagerTopBar from "./ManagerTopBar";
import managerService from "../../services/managerService";
import PageLoading from "../../components/PageLoading/PageLoading";
import "./ManagerLines.css";

const ManagerLines = () => {
  const [linesOverview, setLinesOverview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedLine, setExpandedLine] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table"); // "table" | "card"

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

  // ── Derived stats ──
  const stats = useMemo(() => {
    const running = linesOverview.filter((l) => l.status?.toLowerCase() === "running").length;
    const idle = linesOverview.filter((l) => l.status?.toLowerCase() === "idle").length;
    const maintenance = linesOverview.filter((l) => l.status?.toLowerCase() === "maintenance").length;
    const totalMachines = linesOverview.reduce((s, l) => s + (l.availableMachines || 0), 0);
    const avgEfficiency =
      linesOverview.length > 0
        ? Math.round(
            linesOverview.reduce((s, l) => {
              const machines = l.machines || [];
              const lineEff =
                machines.length > 0
                  ? machines.reduce((ms, m) => ms + (m.efficiency || 0), 0) / machines.length
                  : 0;
              return s + lineEff;
            }, 0) / linesOverview.length
          )
        : 0;
    return { running, idle, maintenance, totalMachines, avgEfficiency };
  }, [linesOverview]);

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

  const filteredLines = useMemo(() => {
    let result = linesOverview;
    if (filterStatus) {
      result = result.filter((l) => l.status?.toLowerCase() === filterStatus.toLowerCase());
    }
    if (searchTerm.trim()) {
      result = result.filter((l) =>
        l.lineName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return result;
  }, [linesOverview, filterStatus, searchTerm]);

  const handleStatCardClick = (status) => {
    setFilterStatus(filterStatus === status ? "" : status);
  };

  return (
    <div className="manager-container">
      <ManagerSidebar />

      <main className="manager-main">
        {/* Top Bar - outside page-content, same as Dashboard */}
        <ManagerTopBar
          searchPlaceholder="Search lines, machines..."
          onSearch={(term) => setSearchTerm(term)}
        />

        <div className="page-content">
          {/* ── Header ── */}
  

          {/* ── Summary Cards ── */}
          <div className="ln-stats-grid">
            <div
              className={`ln-stat-card ln-stat-running ${filterStatus === "running" ? "ln-stat-active" : ""}`}
              onClick={() => handleStatCardClick("running")}
            >
              <div className="ln-stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <div className="ln-stat-info">
                <span className="ln-stat-value">{stats.running}</span>
                <span className="ln-stat-label">Running</span>
              </div>
            </div>

            <div
              className={`ln-stat-card ln-stat-idle ${filterStatus === "idle" ? "ln-stat-active" : ""}`}
              onClick={() => handleStatCardClick("idle")}
            >
              <div className="ln-stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              </div>
              <div className="ln-stat-info">
                <span className="ln-stat-value">{stats.idle}</span>
                <span className="ln-stat-label">Idle</span>
              </div>
            </div>

            <div
              className={`ln-stat-card ln-stat-maint ${filterStatus === "maintenance" ? "ln-stat-active" : ""}`}
              onClick={() => handleStatCardClick("maintenance")}
            >
              <div className="ln-stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <div className="ln-stat-info">
                <span className="ln-stat-value">{stats.maintenance}</span>
                <span className="ln-stat-label">Maintenance</span>
              </div>
            </div>

            <div className="ln-stat-card ln-stat-eff">
              <div className="ln-stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className="ln-stat-info">
                <span className="ln-stat-value">{stats.avgEfficiency}%</span>
                <span className="ln-stat-label">Avg Efficiency</span>
              </div>
            </div>

            <div className="ln-stat-card ln-stat-machines">
              <div className="ln-stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                  <line x1="6" y1="6" x2="6.01" y2="6" />
                  <line x1="6" y1="18" x2="6.01" y2="18" />
                </svg>
              </div>
              <div className="ln-stat-info">
                <span className="ln-stat-value">{stats.totalMachines}</span>
                <span className="ln-stat-label">Total Machines</span>
              </div>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="ln-error">
              <div className="ln-error-icon">⚠️</div>
              <div className="ln-error-text">
                <strong>Something went wrong</strong>
                <span>{error}</span>
              </div>
              <button onClick={fetchLinesData}>Retry</button>
            </div>
          )}

          {/* ── Toolbar ── */}
          <div className="ln-toolbar">
            <div className="ln-search-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a92a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search lines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ln-search-input"
              />
              {searchTerm && (
                <button className="ln-search-clear" onClick={() => setSearchTerm("")}>
                  ×
                </button>
              )}
            </div>

            <div className="ln-toolbar-right">
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

              <div className="ln-view-toggle">
                <button
                  className={`ln-view-btn ${viewMode === "table" ? "ln-view-active" : ""}`}
                  onClick={() => setViewMode("table")}
                  title="Table view"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </button>
                <button
                  className={`ln-view-btn ${viewMode === "card" ? "ln-view-active" : ""}`}
                  onClick={() => setViewMode("card")}
                  title="Card view"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </button>
              </div>

              <span className="ln-badge">{filteredLines.length} lines</span>
            </div>
          </div>

          {/* ── Content ── */}
          {loading ? (
            <PageLoading variant="inline" text="Loading production lines..." />
          ) : filteredLines.length === 0 ? (
            <div className="ln-empty">
              <div className="ln-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 3h-8l-2 4h12z" />
                </svg>
              </div>
              <strong>No lines found</strong>
              <span>Try changing your filters or search query</span>
              {(filterStatus || searchTerm) && (
                <button
                  className="ln-empty-clear"
                  onClick={() => {
                    setFilterStatus("");
                    setSearchTerm("");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : viewMode === "table" ? (
            /* ── Table View ── */
            <section className="ln-panel">
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
                        ((line.busyHours || 0) / (line.availableHours || 8)) * 100;
                      const progressPct =
                        line.targetToday > 0
                          ? ((line.completedToday || 0) / (line.targetToday || 1)) * 100
                          : 0;

                      return (
                        <React.Fragment key={line.lineId}>
                          <tr
                            className={`ln-row ${isExpanded ? "ln-row-active" : ""}`}
                            onClick={() => toggleLine(line.lineId)}
                          >
                            <td className="ln-cell-toggle">
                              <span className={`ln-chevron ${isExpanded ? "ln-chevron-open" : ""}`}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="9 18 15 12 9 6" />
                                </svg>
                              </span>
                            </td>
                            <td className="ln-cell-name">{line.lineName}</td>
                            <td>
                              <span className={`ln-status ${getStatusClass(line.status)}`}>
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
                            <td className="ln-cell-num">{line.availableMachines || 0}</td>
                            <td>
                              {line.currentOrder ? (
                                <span className="ln-order-tag">#{line.currentOrder}</span>
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

                          {isExpanded && (
                            <tr className="ln-expand-row">
                              <td colSpan="7">
                                <div className="ln-expand-content">
                                  {line.machines && line.machines.length > 0 ? (
                                    <div className="ln-machines-section">
                                      <h4>Machines</h4>
                                      <div className="ln-machines-grid">
                                        {line.machines.map((machine) => (
                                          <div key={machine.id} className="ln-machine-item">
                                            <div className="ln-machine-left">
                                              <span className="ln-machine-name">{machine.name}</span>
                                              <span className={`ln-status ln-status-sm ${getStatusClass(machine.status)}`}>
                                                {machine.status}
                                              </span>
                                            </div>
                                            <div className="ln-machine-eff">
                                              <div className={`ln-eff-ring ${getEfficiencyClass(machine.efficiency)}`}>
                                                <svg viewBox="0 0 36 36" className="ln-ring-svg">
                                                  <path
                                                    className="ln-ring-bg"
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                  />
                                                  <path
                                                    className="ln-ring-fill"
                                                    strokeDasharray={`${machine.efficiency || 0}, 100`}
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                  />
                                                </svg>
                                                <span className="ln-ring-text">{machine.efficiency || 0}%</span>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="ln-no-machines">No machine data available</div>
                                  )}
                                  {line.supervisor && (
                                    <div className="ln-supervisor">
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a92a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                      </svg>
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
            </section>
          ) : (
            /* ── Card View ── */
            <div className="ln-cards-grid">
              {filteredLines.map((line) => {
                const utilization =
                  ((line.busyHours || 0) / (line.availableHours || 8)) * 100;
                const progressPct =
                  line.targetToday > 0
                    ? ((line.completedToday || 0) / (line.targetToday || 1)) * 100
                    : 0;
                const isExpanded = expandedLine === line.lineId;

                return (
                  <div
                    key={line.lineId}
                    className={`ln-card ${isExpanded ? "ln-card-expanded" : ""}`}
                    onClick={() => toggleLine(line.lineId)}
                  >
                    <div className="ln-card-top">
                      <div className="ln-card-title">
                        <h3>{line.lineName}</h3>
                        <span className={`ln-status ${getStatusClass(line.status)}`}>
                          {line.status || "N/A"}
                        </span>
                      </div>
                      {line.currentOrder && (
                        <span className="ln-order-tag">#{line.currentOrder}</span>
                      )}
                    </div>

                    <div className="ln-card-metrics">
                      <div className="ln-card-metric">
                        <span className="ln-card-metric-label">Operating</span>
                        <span className="ln-card-metric-value">
                          {line.busyHours || 0}h / {line.availableHours || 8}h
                        </span>
                        <div className="ln-bar">
                          <div className="ln-bar-fill" style={{ width: `${Math.min(utilization, 100)}%` }} />
                        </div>
                      </div>

                      <div className="ln-card-metric">
                        <span className="ln-card-metric-label">Today's Progress</span>
                        {line.targetToday > 0 ? (
                          <>
                            <span className="ln-card-metric-value">
                              {(line.completedToday || 0).toLocaleString()} / {(line.targetToday || 0).toLocaleString()}
                            </span>
                            <div className="ln-progress-bar">
                              <div className="ln-progress-fill" style={{ width: `${Math.min(progressPct, 100)}%` }} />
                            </div>
                          </>
                        ) : (
                          <span className="ln-cell-muted">No target set</span>
                        )}
                      </div>
                    </div>

                    <div className="ln-card-footer">
                      <div className="ln-card-footer-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a92a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                          <line x1="6" y1="6" x2="6.01" y2="6" />
                          <line x1="6" y1="18" x2="6.01" y2="18" />
                        </svg>
                        <span>{line.availableMachines || 0} machines</span>
                      </div>
                      {line.supervisor && (
                        <div className="ln-card-footer-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a92a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          <span>{line.supervisor}</span>
                        </div>
                      )}
                    </div>

                    {/* Expanded machines in card */}
                    {isExpanded && line.machines && line.machines.length > 0 && (
                      <div className="ln-card-machines">
                        <h4>Machines</h4>
                        <div className="ln-card-machines-list">
                          {line.machines.map((machine) => (
                            <div key={machine.id} className="ln-machine-item">
                              <div className="ln-machine-left">
                                <span className="ln-machine-name">{machine.name}</span>
                                <span className={`ln-status ln-status-sm ${getStatusClass(machine.status)}`}>
                                  {machine.status}
                                </span>
                              </div>
                              <div className="ln-machine-eff">
                                <div className={`ln-eff-ring ${getEfficiencyClass(machine.efficiency)}`}>
                                  <svg viewBox="0 0 36 36" className="ln-ring-svg">
                                    <path
                                      className="ln-ring-bg"
                                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path
                                      className="ln-ring-fill"
                                      strokeDasharray={`${machine.efficiency || 0}, 100`}
                                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                  </svg>
                                  <span className="ln-ring-text">{machine.efficiency || 0}%</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManagerLines;
