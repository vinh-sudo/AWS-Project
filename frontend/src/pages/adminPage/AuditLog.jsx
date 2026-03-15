import React, { useCallback, useEffect, useMemo, useState } from "react";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import AdminSidebar from "../../components/AdminSidebar/AdminSidebar";
import authService from "../../services/authService";
import adminService from "../../services/adminService";
import PageLoading from "../../components/PageLoading/PageLoading";
import "./adminUser.css";
import "./AuditLog.css";

const FILTER_MODES = {
  ALL: "ALL",
  CRITICAL: "CRITICAL",
  ACTION: "ACTION",
  USER: "USER",
  ENTITY: "ENTITY",
};

const ACTION_OPTIONS = [
  "LOGIN",
  "LOGOUT",
  "LOGIN_FAILED",
  "CREATE_ACCOUNT",
  "UPDATE_ACCOUNT",
  "DELETE_ACCOUNT",
  "CHANGE_ROLE",
  "LOCK_ACCOUNT",
  "UNLOCK_ACCOUNT",
  "CREATE_ORDER",
  "UPDATE_ORDER",
  "DELETE_ORDER",
  "CONFIRM_ORDER",
  "CANCEL_ORDER",
  "CREATE_PLAN",
  "UPDATE_PLAN",
  "DELETE_PLAN",
  "CONFIRM_PLAN",
  "CANCEL_PLAN",
  "CREATE_SCHEDULE",
  "START_SCHEDULE",
  "PAUSE_SCHEDULE",
  "RESUME_SCHEDULE",
  "COMPLETE_SCHEDULE",
  "REPORT_PROGRESS",
  "CREATE_REPORT",
  "UPDATE_REPORT",
  "ASSIGN_LEADER",
  "UNASSIGN_LEADER",
  "SYSTEM_ACTION",
];

const ENTITY_OPTIONS = [
  "ORDER",
  "ACCOUNT",
  "PLAN",
  "SCHEDULE",
  "REPORT",
  "ASSIGNMENT",
  "SYSTEM",
];

const CRITICAL_ACTIONS = new Set([
  "CHANGE_ROLE",
  "LOCK_ACCOUNT",
  "UNLOCK_ACCOUNT",
  "DELETE_ACCOUNT",
  "DELETE_ORDER",
  "START_SCHEDULE",
  "COMPLETE_SCHEDULE",
]);

const DIGITS_ONLY = /^\d+$/;

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return (
    date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    " " +
    date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  );
};

const toInputDateTime = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toIsoStringOrNull = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

const formatActionLabel = (value) => value?.replaceAll("_", " ") || "-";

const parseDetailsForDisplay = (details) => {
  if (!details) return "No details";
  try {
    const parsed = JSON.parse(details);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return details;
  }
};

const AuditLog = () => {
  const currentUser = authService.getCurrentUser();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState(FILTER_MODES.CRITICAL);

  const [actionType, setActionType] = useState("CREATE_ORDER");
  const [userId, setUserId] = useState("");
  const [entity, setEntity] = useState("ORDER");
  const [entityId, setEntityId] = useState("");

  const [sinceDate, setSinceDate] = useState(
    toInputDateTime(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
  );
  const [startDate, setStartDate] = useState(
    toInputDateTime(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
  );
  const [endDate, setEndDate] = useState(toInputDateTime(new Date()));

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [selectedLog, setSelectedLog] = useState(null);

  const userInitial = (currentUser?.fullName || "A").charAt(0).toUpperCase();

  const getPageNumbers = useCallback(() => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible);
    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible);
    }
    for (let i = start; i < end; i += 1) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  const resolveRequest = useCallback(async () => {
    const commonParams = { page: currentPage, size: pageSize };

    switch (mode) {
      case FILTER_MODES.CRITICAL:
        return adminService.getCriticalAuditLogs({
          ...commonParams,
          since: toIsoStringOrNull(sinceDate),
        });
      case FILTER_MODES.ACTION:
        return adminService.getAuditLogsByAction(actionType, {
          ...commonParams,
          since: toIsoStringOrNull(sinceDate),
        });
      case FILTER_MODES.USER:
        if (!userId.trim()) {
          throw new Error("Please enter User ID");
        }
        if (!DIGITS_ONLY.test(userId.trim())) {
          throw new Error("User ID must be numeric");
        }
        return adminService.getAuditLogsByUser(userId.trim(), {
          ...commonParams,
          startDate: toIsoStringOrNull(startDate),
          endDate: toIsoStringOrNull(endDate),
        });
      case FILTER_MODES.ENTITY:
        if (!entityId.trim()) {
          throw new Error("Please enter Entity ID");
        }
        if (!DIGITS_ONLY.test(entityId.trim())) {
          throw new Error("Entity ID must be numeric");
        }
        return adminService.getAuditLogsByEntity(
          entity,
          entityId.trim(),
          commonParams,
        );
      case FILTER_MODES.ALL:
      default:
        // Safe fallback mode: backend /api/admin/audit-logs may return 500 on some datasets.
        // Keep UI operational by using critical endpoint with a broader time window.
        return adminService.getCriticalAuditLogs({
          ...commonParams,
          since: toIsoStringOrNull(startDate),
        });
    }
  }, [
    actionType,
    currentPage,
    endDate,
    entity,
    entityId,
    mode,
    pageSize,
    sinceDate,
    startDate,
    userId,
  ]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await resolveRequest();
      setLogs(Array.isArray(data?.content) ? data.content : []);
      setTotalElements(data?.totalElements || 0);
      setTotalPages(data?.totalPages || 0);
    } catch (err) {
      setLogs([]);
      setTotalElements(0);
      setTotalPages(0);
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          err.message ||
          "Unable to load audit logs",
      );
    } finally {
      setLoading(false);
    }
  }, [resolveRequest]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const criticalCountOnPage = useMemo(
    () => logs.filter((log) => CRITICAL_ACTIONS.has(log.actionType)).length,
    [logs],
  );

  const handleApplyFilters = () => {
    if (currentPage === 0) {
      fetchAuditLogs();
      return;
    }
    setCurrentPage(0);
  };

  const handleResetFilters = () => {
    setMode(FILTER_MODES.CRITICAL);
    setActionType("CREATE_ORDER");
    setUserId("");
    setEntity("ORDER");
    setEntityId("");
    setSinceDate(
      toInputDateTime(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    );
    setStartDate(
      toInputDateTime(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    );
    setEndDate(toInputDateTime(new Date()));
    if (currentPage === 0) {
      fetchAuditLogs();
      return;
    }
    setCurrentPage(0);
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="admin-container auditlog-page">
      <AdminSidebar />

      <div className="admin-main">
        <header className="dash-header">
          <div className="dash-header-left">
            <div className="dash-header-avatar">{userInitial}</div>
            <div>
              <h1 className="dash-title">Audit Log</h1>
              <p className="dash-subtitle">
                System activity logs and security history
                <span className="dash-last-updated">
                  {" "}
                  · {totalElements} records
                </span>
              </p>
            </div>
          </div>
          <div className="dash-header-right">
            <button
              className="dash-refresh-btn"
              onClick={fetchAuditLogs}
              title="Refresh audit logs"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
            </button>
            <NotificationBell />
          </div>
        </header>

        <div className="admin-content">
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
              <button className="error-banner-btn" onClick={fetchAuditLogs}>
                Retry
              </button>
            </div>
          )}

          <div className="content-header">
            <h2 className="content-title">System Activity Logs</h2>
          </div>

          <div className="auditlog-stats">
            <div className="auditlog-chip">
              <span className="auditlog-chip-label">Total Results</span>
              <span className="auditlog-chip-value">{totalElements}</span>
            </div>
            <div className="auditlog-chip">
              <span className="auditlog-chip-label">Current Page</span>
              <span className="auditlog-chip-value">{currentPage + 1}</span>
            </div>
            <div className="auditlog-chip">
              <span className="auditlog-chip-label">Critical (Page)</span>
              <span className="auditlog-chip-value critical">
                {criticalCountOnPage}
              </span>
            </div>
          </div>

          <div className="auditlog-toolbar">
            <div className="form-group">
              <label className="form-label" htmlFor="filterMode">
                Filter Mode
              </label>
              <select
                id="filterMode"
                className="form-select"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value={FILTER_MODES.ALL}>Recent security feed</option>
                <option value={FILTER_MODES.CRITICAL}>Critical actions</option>
                <option value={FILTER_MODES.ACTION}>By action type</option>
                <option value={FILTER_MODES.USER}>By user</option>
                <option value={FILTER_MODES.ENTITY}>By entity + ID</option>
              </select>
            </div>

            {mode === FILTER_MODES.ACTION && (
              <div className="form-group">
                <label className="form-label" htmlFor="actionType">
                  Action Type
                </label>
                <select
                  id="actionType"
                  className="form-select"
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                >
                  {ACTION_OPTIONS.map((action) => (
                    <option key={action} value={action}>
                      {formatActionLabel(action)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(mode === FILTER_MODES.CRITICAL ||
              mode === FILTER_MODES.ACTION) && (
              <div className="form-group">
                <label className="form-label" htmlFor="sinceDate">
                  Since
                </label>
                <input
                  id="sinceDate"
                  className="form-input"
                  type="datetime-local"
                  value={sinceDate}
                  onChange={(e) => setSinceDate(e.target.value)}
                />
              </div>
            )}

            {mode === FILTER_MODES.USER && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="userId">
                    User ID
                  </label>
                  <input
                    id="userId"
                    className="form-input"
                    placeholder="e.g. 12"
                    value={userId}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    onChange={(e) =>
                      setUserId(e.target.value.replace(/\D/g, ""))
                    }
                  />
                </div>
                <div className="auditlog-toolbar-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" htmlFor="startDate">
                      Start Date
                    </label>
                    <input
                      id="startDate"
                      className="form-input"
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" htmlFor="endDate">
                      End Date
                    </label>
                    <input
                      id="endDate"
                      className="form-input"
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {mode === FILTER_MODES.ENTITY && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="entityType">
                    Entity
                  </label>
                  <select
                    id="entityType"
                    className="form-select"
                    value={entity}
                    onChange={(e) => setEntity(e.target.value)}
                  >
                    {ENTITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="entityId">
                    Entity ID
                  </label>
                  <input
                    id="entityId"
                    className="form-input"
                    placeholder="e.g. 101"
                    value={entityId}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    onChange={(e) =>
                      setEntityId(e.target.value.replace(/\D/g, ""))
                    }
                  />
                </div>
              </>
            )}

            <div className="auditlog-toolbar-actions">
              <div className="auditlog-actions-group">
                <button className="btn-primary" onClick={handleApplyFilters}>
                  Apply
                </button>
                <button
                  className="auditlog-btn-secondary"
                  onClick={handleResetFilters}
                >
                  Reset
                </button>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="pageSize">
                  Page size
                </label>
                <select
                  id="pageSize"
                  className="form-select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(0);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          <div className="table-wrapper" style={{ position: "relative" }}>
            {loading && <PageLoading variant="overlay" />}

            {!loading && logs.length === 0 ? (
              <div className="auditlog-empty">
                No audit logs found for selected filters.
              </div>
            ) : (
              <table className="auditlog-table">
                <thead>
                  <tr>
                    <th className="table-header">Time</th>
                    <th className="table-header">Action</th>
                    <th className="table-header">Entity</th>
                    <th className="table-header">User</th>
                    <th className="table-header">IP Address</th>
                    <th className="table-header">Details</th>
                    <th className="table-header" style={{ textAlign: "right" }}>
                      View
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const isCritical = CRITICAL_ACTIONS.has(log.actionType);
                    const detailsText = parseDetailsForDisplay(log.details);
                    return (
                      <tr key={log.id} className="table-row">
                        <td className="table-cell">
                          <div className="auditlog-cell-meta">
                            <span className="auditlog-cell-main">
                              {formatDateTime(log.timestamp)}
                            </span>
                            <span className="auditlog-cell-sub">
                              ID: {log.id}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span
                            className={`auditlog-cell-action ${isCritical ? "critical" : "default"}`}
                          >
                            {formatActionLabel(log.actionType)}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="auditlog-cell-meta">
                            <span className="auditlog-cell-main">
                              {log.entity || "-"}
                            </span>
                            <span className="auditlog-cell-sub">
                              Entity ID: {log.entityId ?? "-"}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell">{log.userId ?? "-"}</td>
                        <td className="table-cell">{log.ipAddress || "-"}</td>
                        <td className="table-cell">
                          <div className="auditlog-details">{detailsText}</div>
                        </td>
                        <td className="table-cell">
                          <div
                            className="actions-cell"
                            style={{ justifyContent: "flex-end" }}
                          >
                            <button
                              className="action-button"
                              onClick={() => setSelectedLog(log)}
                              title="View full details"
                            >
                              🔍
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="auditlog-pagination">
            <div className="pagination-info">
              Showing page <strong>{currentPage + 1}</strong> of{" "}
              <strong>{Math.max(totalPages, 1)}</strong>
            </div>
            <div className="auditlog-pagination-right">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                disabled={currentPage === 0 || loading}
              >
                Prev
              </button>

              {pageNumbers.map((page) => (
                <button
                  key={page}
                  className={`pagination-btn ${currentPage === page ? "active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                  disabled={loading}
                >
                  {page + 1}
                </button>
              ))}

              <button
                className="pagination-btn"
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, Math.max(totalPages - 1, 0)),
                  )
                }
                disabled={
                  currentPage >= totalPages - 1 || loading || totalPages === 0
                }
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {selectedLog && (
          <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Audit Log Details</h3>
                <button
                  className="close-button"
                  onClick={() => setSelectedLog(null)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Log ID</label>
                  <div
                    className="form-input"
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    {selectedLog.id}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Action</label>
                    <div
                      className="form-input"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      {formatActionLabel(selectedLog.actionType)}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time</label>
                    <div
                      className="form-input"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      {formatDateTime(selectedLog.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Entity</label>
                    <div
                      className="form-input"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      {selectedLog.entity || "-"}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Entity ID</label>
                    <div
                      className="form-input"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      {selectedLog.entityId ?? "-"}
                    </div>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">User ID</label>
                    <div
                      className="form-input"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      {selectedLog.userId ?? "-"}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">IP Address</label>
                    <div
                      className="form-input"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      {selectedLog.ipAddress || "-"}
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Details</label>
                  <pre className="auditlog-modal-details">
                    {parseDetailsForDisplay(selectedLog.details)}
                  </pre>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn-cancel"
                  onClick={() => setSelectedLog(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;
