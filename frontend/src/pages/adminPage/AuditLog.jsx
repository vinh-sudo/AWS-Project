import React, { useCallback, useEffect, useMemo, useState } from "react";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import AdminSidebar from "../../components/AdminSidebar/AdminSidebar";
import authService from "../../services/authService";
import adminService from "../../services/adminService";
import PageLoading from "../../components/PageLoading/PageLoading";
import "./adminUser.css";
import "./AuditLog.css";

const MAX_ACTION_FETCH_SIZE = 200;

const ACTION_GROUPS = {
  ACCOUNT: [
    "CREATE_ACCOUNT",
    "UPDATE_ACCOUNT",
    "DELETE_ACCOUNT",
    "CHANGE_ROLE",
    "LOCK_ACCOUNT",
    "UNLOCK_ACCOUNT",
  ],
  ORDER: [
    "CREATE_ORDER",
    "UPDATE_ORDER",
    "DELETE_ORDER",
    "CONFIRM_ORDER",
    "CANCEL_ORDER",
  ],
  PLAN: [
    "CREATE_PLAN",
    "UPDATE_PLAN",
    "DELETE_PLAN",
    "CONFIRM_PLAN",
    "CANCEL_PLAN",
  ],
  SCHEDULE: [
    "CREATE_SCHEDULE",
    "START_SCHEDULE",
    "PAUSE_SCHEDULE",
    "RESUME_SCHEDULE",
    "COMPLETE_SCHEDULE",
  ],
  REPORT: ["REPORT_PROGRESS", "CREATE_REPORT", "UPDATE_REPORT"],
};

const ACTION_GROUP_OPTIONS = [
  { value: "ACCOUNT", label: "Account" },
  { value: "ORDER", label: "Order" },
  { value: "SCHEDULE", label: "Schedule" },
  { value: "PLAN", label: "Plan" },
  { value: "REPORT", label: "Report" },
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

const formatActionLabel = (value) => value?.replaceAll("_", " ") || "-";

const AuditLog = () => {
  const currentUser = authService.getCurrentUser();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionGroup, setActionGroup] = useState("ORDER");

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

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

  const fetchLogsByActionGroup = useCallback(async (group) => {
    const actions = ACTION_GROUPS[group] || [];
    if (!actions.length) {
      return [];
    }

    const responses = await Promise.all(
      actions.map((action) =>
        adminService.getAuditLogsByAction(action, {
          page: 0,
          size: MAX_ACTION_FETCH_SIZE,
        }),
      ),
    );

    const mergedById = new Map();
    responses.forEach((response) => {
      (response?.content || []).forEach((log) => {
        if (log?.id == null) return;
        if (!mergedById.has(log.id)) {
          mergedById.set(log.id, log);
        }
      });
    });

    return Array.from(mergedById.values()).sort((a, b) => {
      const aTime = new Date(a.timestamp || 0).getTime();
      const bTime = new Date(b.timestamp || 0).getTime();
      return bTime - aTime;
    });
  }, []);

  const resolveRequest = useCallback(async () => {
    const groupedLogs = await fetchLogsByActionGroup(actionGroup);
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    return {
      content: groupedLogs.slice(startIndex, endIndex),
      totalElements: groupedLogs.length,
      totalPages: Math.ceil(groupedLogs.length / pageSize),
    };
  }, [actionGroup, currentPage, fetchLogsByActionGroup, pageSize]);

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
    setActionGroup("ORDER");
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
              <label className="form-label" htmlFor="actionGroup">
                Type
              </label>
              <select
                id="actionGroup"
                className="form-select"
                value={actionGroup}
                onChange={(e) => setActionGroup(e.target.value)}
              >
                {ACTION_GROUP_OPTIONS.map((group) => (
                  <option key={group.value} value={group.value}>
                    {group.label}
                  </option>
                ))}
              </select>
            </div>

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
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const isCritical = CRITICAL_ACTIONS.has(log.actionType);
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
      </div>
    </div>
  );
};

export default AuditLog;
