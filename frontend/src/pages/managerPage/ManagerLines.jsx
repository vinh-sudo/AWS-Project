import React, { useState, useEffect, useMemo } from "react";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import ManagerTopBar from "./ManagerTopBar";
import managerService from "../../services/managerService";
import PageLoading from "../../components/PageLoading/PageLoading";
import "./ManagerLines.css";

const extractLinesOverviewData = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const normalizeStatus = (status) => {
  const normalized = (status || "").toString().trim().toUpperCase();
  if (["RUNNING", "OK"].includes(normalized)) return "ok";
  if (["IDLE", "TIGHT"].includes(normalized)) return "tight";
  if (["MAINTENANCE", "OVERLOAD"].includes(normalized)) return "overload";
  return "unknown";
};

const getDisplayStatus = (status) => {
  const normalized = normalizeStatus(status);
  if (normalized === "ok") return "OK";
  if (normalized === "tight") return "TIGHT";
  if (normalized === "overload") return "OVERLOAD";
  return status || "N/A";
};

const parseNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const mapLineData = (line) => ({
  ...line,
  lineId: line?.lineId ?? line?.id,
  lineName: line?.lineName ?? line?.name ?? "Unknown Line",
  busyHours: parseNumber(line?.busyHours),
  availableHours: parseNumber(line?.availableHours),
  availableMachines: parseNumber(line?.availableMachines),
  status: getDisplayStatus(line?.status),
});

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
      const normalizedLines =
        extractLinesOverviewData(response).map(mapLineData);
      setLinesOverview(normalizedLines);
    } catch (error) {
      console.error("Error fetching lines:", error);
      setError("Unable to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // ── Derived stats ──
  const stats = useMemo(() => {
    const ok = linesOverview.filter(
      (l) => normalizeStatus(l.status) === "ok",
    ).length;
    const tight = linesOverview.filter(
      (l) => normalizeStatus(l.status) === "tight",
    ).length;
    const overload = linesOverview.filter(
      (l) => normalizeStatus(l.status) === "overload",
    ).length;
    const availableMachines = linesOverview.reduce(
      (s, l) => s + parseNumber(l.availableMachines),
      0,
    );
    const avgUtilization =
      linesOverview.length > 0
        ? Math.round(
            linesOverview.reduce((s, l) => {
              const busy = parseNumber(l.busyHours);
              const available = parseNumber(l.availableHours);
              const total = busy + available;
              const utilization = total > 0 ? (busy / total) * 100 : 0;
              return s + utilization;
            }, 0) / linesOverview.length,
          )
        : 0;
    return { ok, tight, overload, availableMachines, avgUtilization };
  }, [linesOverview]);

  const getStatusClass = (status) => {
    switch (normalizeStatus(status)) {
      case "ok":
        return "ln-st-running";
      case "tight":
        return "ln-st-idle";
      case "overload":
        return "ln-st-maintenance";
      case "warning":
        return "ln-st-warning";
      default:
        return "";
    }
  };

  const toggleLine = (lineId) => {
    setExpandedLine(expandedLine === lineId ? null : lineId);
  };

  const filteredLines = useMemo(() => {
    let result = linesOverview;
    if (filterStatus) {
      result = result.filter(
        (l) => normalizeStatus(l.status) === filterStatus.toLowerCase(),
      );
    }
    if (searchTerm.trim()) {
      result = result.filter((l) =>
        l.lineName?.toLowerCase().includes(searchTerm.toLowerCase()),
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
          searchPlaceholder="Search lines..."
          onSearch={(term) => setSearchTerm(term)}
        />

        <div className="page-content">
          {/* ── Header ── */}

          {/* ── Summary Cards ── */}
          <div className="ln-stats-grid">
            <div
              className={`ln-stat-card ln-stat-running ${filterStatus === "ok" ? "ln-stat-active" : ""}`}
              onClick={() => handleStatCardClick("ok")}
            >
              <div className="ln-stat-icon">
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
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <div className="ln-stat-info">
                <span className="ln-stat-value">{stats.ok}</span>
                <span className="ln-stat-label">OK</span>
              </div>
            </div>

            <div
              className={`ln-stat-card ln-stat-idle ${filterStatus === "tight" ? "ln-stat-active" : ""}`}
              onClick={() => handleStatCardClick("tight")}
            >
              <div className="ln-stat-icon">
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
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              </div>
              <div className="ln-stat-info">
                <span className="ln-stat-value">{stats.tight}</span>
                <span className="ln-stat-label">Tight</span>
              </div>
            </div>

            <div
              className={`ln-stat-card ln-stat-maint ${filterStatus === "overload" ? "ln-stat-active" : ""}`}
              onClick={() => handleStatCardClick("overload")}
            >
              <div className="ln-stat-icon">
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
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <div className="ln-stat-info">
                <span className="ln-stat-value">{stats.overload}</span>
                <span className="ln-stat-label">Overload</span>
              </div>
            </div>

            <div className="ln-stat-card ln-stat-eff">
              <div className="ln-stat-icon">
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
              <div className="ln-stat-info">
                <span className="ln-stat-value">{stats.avgUtilization}%</span>
                <span className="ln-stat-label">Avg Utilization</span>
              </div>
            </div>

            <div className="ln-stat-card ln-stat-machines">
              <div className="ln-stat-icon">
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
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                  <line x1="6" y1="6" x2="6.01" y2="6" />
                  <line x1="6" y1="18" x2="6.01" y2="18" />
                </svg>
              </div>
              <div className="ln-stat-info">
                <span className="ln-stat-value">{stats.availableMachines}</span>
                <span className="ln-stat-label">Available Machines</span>
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
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8a92a6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
                <button
                  className="ln-search-clear"
                  onClick={() => setSearchTerm("")}
                >
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
                <option value="ok">OK</option>
                <option value="tight">TIGHT</option>
                <option value="overload">OVERLOAD</option>
              </select>

              <div className="ln-view-toggle">
                <button
                  className={`ln-view-btn ${viewMode === "table" ? "ln-view-active" : ""}`}
                  onClick={() => setViewMode("table")}
                  title="Table view"
                >
                  <svg
                    width="16"
                    height="16"
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
                </button>
                <button
                  className={`ln-view-btn ${viewMode === "card" ? "ln-view-active" : ""}`}
                  onClick={() => setViewMode("card")}
                  title="Card view"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
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
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ccc"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
                      <th>Busy Hours</th>
                      <th>Available Hours</th>
                      <th>Utilization</th>
                      <th>Available Machines</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLines.map((line) => {
                      const isExpanded = expandedLine === line.lineId;
                      const totalHours =
                        parseNumber(line.busyHours) +
                        parseNumber(line.availableHours);
                      const utilization =
                        totalHours > 0
                          ? (parseNumber(line.busyHours) / totalHours) * 100
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
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="9 18 15 12 9 6" />
                                </svg>
                              </span>
                            </td>
                            <td className="ln-cell-name">{line.lineName}</td>
                            <td>
                              <span
                                className={`ln-status ${getStatusClass(line.status)}`}
                              >
                                {getDisplayStatus(line.status)}
                              </span>
                            </td>
                            <td>
                              <span className="ln-hours-text">
                                {parseNumber(line.busyHours).toFixed(1)}h
                              </span>
                            </td>
                            <td>
                              <span className="ln-hours-text">
                                {parseNumber(line.availableHours).toFixed(1)}h
                              </span>
                            </td>
                            <td>
                              <div className="ln-hours">
                                <span className="ln-hours-text">
                                  {Math.round(utilization)}%
                                </span>
                                <div className="ln-bar">
                                  <div
                                    className="ln-bar-fill"
                                    style={{
                                      width: `${Math.min(utilization, 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="ln-cell-num">
                              {line.availableMachines || 0}
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="ln-expand-row">
                              <td colSpan="7">
                                <div className="ln-expand-content">
                                  <div className="ln-capacity-summary">
                                    <div className="ln-capacity-item">
                                      <span className="ln-capacity-label">
                                        Busy Hours
                                      </span>
                                      <strong>
                                        {parseNumber(line.busyHours).toFixed(1)}
                                        h
                                      </strong>
                                    </div>
                                    <div className="ln-capacity-item">
                                      <span className="ln-capacity-label">
                                        Available Hours
                                      </span>
                                      <strong>
                                        {parseNumber(
                                          line.availableHours,
                                        ).toFixed(1)}
                                        h
                                      </strong>
                                    </div>
                                    <div className="ln-capacity-item">
                                      <span className="ln-capacity-label">
                                        Utilization
                                      </span>
                                      <strong>
                                        {Math.round(utilization)}%
                                      </strong>
                                    </div>
                                    <div className="ln-capacity-item">
                                      <span className="ln-capacity-label">
                                        Total Capacity Hours
                                      </span>
                                      <strong>{totalHours.toFixed(1)}h</strong>
                                    </div>
                                    <div className="ln-capacity-item">
                                      <span className="ln-capacity-label">
                                        Available Machines
                                      </span>
                                      <strong>
                                        {parseNumber(line.availableMachines)}
                                      </strong>
                                    </div>
                                  </div>
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
                const totalHours =
                  parseNumber(line.busyHours) +
                  parseNumber(line.availableHours);
                const utilization =
                  totalHours > 0
                    ? (parseNumber(line.busyHours) / totalHours) * 100
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
                        <span
                          className={`ln-status ${getStatusClass(line.status)}`}
                        >
                          {getDisplayStatus(line.status)}
                        </span>
                      </div>
                    </div>

                    <div className="ln-card-metrics">
                      <div className="ln-card-metric">
                        <span className="ln-card-metric-label">Busy Hours</span>
                        <span className="ln-card-metric-value">
                          {parseNumber(line.busyHours).toFixed(1)}h
                        </span>
                      </div>

                      <div className="ln-card-metric">
                        <span className="ln-card-metric-label">
                          Available Hours
                        </span>
                        <span className="ln-card-metric-value">
                          {parseNumber(line.availableHours).toFixed(1)}h
                        </span>
                      </div>

                      <div className="ln-card-metric">
                        <span className="ln-card-metric-label">Utilization</span>
                        <span className="ln-card-metric-value">
                          {Math.round(utilization)}%
                        </span>
                        <div className="ln-bar">
                          <div
                            className="ln-bar-fill"
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="ln-card-footer">
                      <div className="ln-card-footer-item">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#8a92a6"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="2"
                            y="2"
                            width="20"
                            height="8"
                            rx="2"
                            ry="2"
                          />
                          <rect
                            x="2"
                            y="14"
                            width="20"
                            height="8"
                            rx="2"
                            ry="2"
                          />
                          <line x1="6" y1="6" x2="6.01" y2="6" />
                          <line x1="6" y1="18" x2="6.01" y2="18" />
                        </svg>
                        <span>{line.availableMachines || 0} machines</span>
                      </div>
                      {line.supervisor && (
                        <div className="ln-card-footer-item">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#8a92a6"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          <span>{line.supervisor}</span>
                        </div>
                      )}
                    </div>

                    {/* Expanded details in card */}
                    {isExpanded && (
                      <div className="ln-card-machines">
                        <h4>Capacity Details</h4>
                        <div className="ln-card-capacity-grid">
                          <div className="ln-capacity-item">
                            <span className="ln-capacity-label">
                              Busy Hours
                            </span>
                            <strong>
                              {parseNumber(line.busyHours).toFixed(1)}h
                            </strong>
                          </div>
                          <div className="ln-capacity-item">
                            <span className="ln-capacity-label">
                              Available Hours
                            </span>
                            <strong>
                              {parseNumber(line.availableHours).toFixed(1)}h
                            </strong>
                          </div>
                          <div className="ln-capacity-item">
                            <span className="ln-capacity-label">
                              Utilization
                            </span>
                            <strong>{Math.round(utilization)}%</strong>
                          </div>
                          <div className="ln-capacity-item">
                            <span className="ln-capacity-label">
                              Total Capacity Hours
                            </span>
                            <strong>{totalHours.toFixed(1)}h</strong>
                          </div>
                          <div className="ln-capacity-item">
                            <span className="ln-capacity-label">
                              Available Machines
                            </span>
                            <strong>
                              {parseNumber(line.availableMachines)}
                            </strong>
                          </div>
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
