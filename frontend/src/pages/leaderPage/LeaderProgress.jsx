// ============================================================================
// LeaderProgress — Connected to backend LeaderController API
// Endpoints used:
//   GET  /api/leader/dashboard    → overview + active schedules + incidents
//   GET  /api/leader/schedules    → schedule list
//   PUT  /api/leader/progress     → update progress
//   POST /api/leader/incident     → report incident
//   POST /api/leader/report       → submit end-of-shift report
// ============================================================================
import React, { useState, useEffect, useCallback } from "react";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import LeaderSidebar from "../../components/LeaderSidebar/LeaderSidebar";
import authService from "../../services/authService";
import leaderService from "../../services/leaderService";
import scheduleService from "../../services/scheduleService";
import "./LeaderProgress.css";

/* ===== SVG Icon helpers ===== */
const IC = {
  barChart: (
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
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  clipboard: (
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
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  ),
  alertTriangle: (
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
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  refresh: (
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
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  ),
  check: (
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  close: (
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  pause: (
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
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  ),
  play: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  clock: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  inbox: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  ),
};

const LeaderProgress = () => {
  const [activeTab, setActiveTab] = useState("inProgress");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [newPercentage, setNewPercentage] = useState(0);
  const [progressNote, setProgressNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Current leader info from auth
  const currentUser = authService.getCurrentUser();
  const currentLeaderName = currentUser?.fullName || "Leader";

  // Dashboard data from API
  const [dashboard, setDashboard] = useState(null);
  const [schedules, setSchedules] = useState([]);

  // Incident types (matching backend incidentType field)
  const incidentTypes = [
    "MACHINE_FAILURE",
    "MATERIAL_SHORTAGE",
    "QUALITY_ISSUE",
    "SAFETY_INCIDENT",
    "LABOR_SHORTAGE",
    "OTHER",
  ];

  const incidentTypeLabels = {
    MACHINE_FAILURE: "Machine Failure",
    MATERIAL_SHORTAGE: "Material Shortage",
    QUALITY_ISSUE: "Quality Issue",
    SAFETY_INCIDENT: "Safety Incident",
    LABOR_SHORTAGE: "Labor Shortage",
    OTHER: "Other",
  };

  const [newIncident, setNewIncident] = useState({
    incidentType: "MACHINE_FAILURE",
    description: "",
    severity: "MEDIUM",
    machineId: null,
  });

  // End-of-shift report state
  const [shiftReport, setShiftReport] = useState({
    shift: "MORNING",
    targetQuantity: 0,
    goodQuantity: 0,
    rejectQuantity: 0,
    downtimeMinutes: 0,
    notes: "",
  });

  // Detect specific error types for user-friendly messages
  const getErrorMessage = (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message || "";

    if (status === 404 && message.toLowerCase().includes("assignment")) {
      return "NOT_ASSIGNED";
    }
    if (status === 404) {
      return "NOT_ASSIGNED";
    }
    if (status === 403) {
      return "You do not have permission to access this page.";
    }
    if (status === 401) {
      return "Session expired. Please log in again.";
    }
    return message || "Unable to load data. Please try again.";
  };

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardRes, schedulesRes] = await Promise.allSettled([
        leaderService.getDashboard(),
        leaderService.getMySchedules(),
      ]);

      setDashboard(
        dashboardRes.status === "fulfilled" ? dashboardRes.value : null,
      );
      setSchedules(
        schedulesRes.status === "fulfilled" ? schedulesRes.value || [] : [],
      );

      const rejections = [dashboardRes, schedulesRes].filter(
        (r) => r.status === "rejected",
      );
      if (rejections.length > 0) {
        const errorMsg = getErrorMessage(rejections[0].reason);
        if (errorMsg === "NOT_ASSIGNED") {
          setError("NOT_ASSIGNED");
        } else if (rejections.length === 2) {
          setError(errorMsg);
        } else {
          console.warn("Partial leader data errors:", rejections);
        }
      }
    } catch (err) {
      console.error("Error fetching leader data:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Pause / Resume schedule
  const handlePauseSchedule = async (scheduleId) => {
    try {
      await scheduleService.pauseSchedule(scheduleId);
      alert("⏸️ Schedule paused!");
      fetchData();
    } catch (err) {
      alert(`❌ Error: ${err.response?.data?.message || "Unable to pause"}`);
    }
  };

  const handleResumeSchedule = async (scheduleId) => {
    try {
      await scheduleService.resumeSchedule(scheduleId);
      alert("▶️ Schedule resumed!");
      fetchData();
    } catch (err) {
      alert(`❌ Error: ${err.response?.data?.message || "Unable to resume"}`);
    }
  };

  // Filter based on active tab
  const getFilteredSchedules = () => {
    switch (activeTab) {
      case "scheduled":
        return schedules.filter((s) => s.status === "SCHEDULED");
      case "inProgress":
        return schedules.filter((s) => s.status === "RUNNING");
      case "completed":
        return schedules.filter((s) => s.status === "COMPLETED");
      case "onHold":
        return schedules.filter((s) => s.status === "PAUSED");
      default:
        return schedules;
    }
  };

  const openUpdateModal = (schedule) => {
    setSelectedSchedule(schedule);
    setNewPercentage(0);
    setProgressNote("");
    setShowUpdateModal(true);
  };

  const openIncidentModal = (schedule) => {
    setSelectedSchedule(schedule);
    setNewIncident({
      incidentType: "MACHINE_FAILURE",
      description: "",
      severity: "MEDIUM",
      machineId: null,
    });
    setShowIncidentModal(true);
  };

  const openReportModal = () => {
    setShiftReport({
      shift: "MORNING",
      targetQuantity: 0,
      goodQuantity: 0,
      rejectQuantity: 0,
      downtimeMinutes: 0,
      notes: "",
    });
    setShowReportModal(true);
  };

  const handleUpdateProgress = async () => {
    try {
      const result = await leaderService.updateProgress({
        scheduleId: selectedSchedule.scheduleId,
        percentage: newPercentage,
        note: progressNote || undefined,
      });
      alert(`✅ ${result.message || "Progress updated!"}`);
      setShowUpdateModal(false);
      setSelectedSchedule(null);
      fetchData();
    } catch (err) {
      alert(`❌ Error: ${err.response?.data?.message || "Unable to update"}`);
    }
  };

  const handleReportIncident = async () => {
    try {
      await leaderService.reportIncident({
        scheduleId: selectedSchedule.scheduleId,
        machineId: newIncident.machineId || undefined,
        incidentType: newIncident.incidentType,
        severity: newIncident.severity,
        description: newIncident.description,
      });
      alert("⚠️ Incident reported successfully!");
      setShowIncidentModal(false);
      setSelectedSchedule(null);
      fetchData();
    } catch (err) {
      alert(
        `❌ Error: ${err.response?.data?.message || "Unable to report incident"}`,
      );
    }
  };

  const handleSubmitReport = async () => {
    try {
      const result = await leaderService.submitReport(shiftReport);
      alert(`✅ ${result.message || "Shift report submitted successfully!"}`);
      setShowReportModal(false);
      fetchData();
    } catch (err) {
      alert(
        `❌ Error: ${err.response?.data?.message || "Unable to submit report"}`,
      );
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "SCHEDULED":
        return "lp-status-scheduled";
      case "RUNNING":
        return "lp-status-running";
      case "COMPLETED":
        return "lp-status-completed";
      case "PAUSED":
        return "lp-status-paused";
      default:
        return "";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "SCHEDULED":
        return "Scheduled";
      case "RUNNING":
        return "Running";
      case "COMPLETED":
        return "Completed";
      case "PAUSED":
        return "Paused";
      default:
        return status;
    }
  };

  const filteredSchedules = getFilteredSchedules();
  const scheduledCount = schedules.filter(
    (s) => s.status === "SCHEDULED",
  ).length;
  const inProgressCount = schedules.filter(
    (s) => s.status === "RUNNING",
  ).length;
  const completedCount = schedules.filter(
    (s) => s.status === "COMPLETED",
  ).length;
  const onHoldCount = schedules.filter((s) => s.status === "PAUSED").length;
  const totalIncidents = dashboard?.unresolvedIncidentCount || 0;
  const recentIncidents = dashboard?.recentIncidents || [];

  /* ===== Filter chip config ===== */
  const chips = [
    { key: "inProgress", label: "In Production", count: inProgressCount },
    { key: "scheduled", label: "Scheduled", count: scheduledCount },
    { key: "onHold", label: "Paused", count: onHoldCount },
    { key: "completed", label: "Completed", count: completedCount },
  ];

  // ─── RENDER ─────────────────────────────────────────────────────────
  return (
    <div className="lp-layout">
      <LeaderSidebar />

      <main className="lp-content">
        {/* ── Header ────────────────────────────────── */}
        <header className="lp-header">
          <div className="lp-header-left">
            <h1 className="lp-header-title">
              {IC.barChart}
              Production Progress Update
            </h1>
            <p className="lp-header-subtitle">
              {dashboard?.lineName
                ? `${dashboard.lineName} — Today's efficiency: ${dashboard.todayEfficiency || 0}%`
                : "Report production output and incidents for each schedule"}
            </p>
          </div>
          <div className="lp-header-right">
            {totalIncidents > 0 && (
              <div className="lp-incident-badge">
                <span className="lp-incident-badge-count">
                  {totalIncidents}
                </span>
                Open Incidents
              </div>
            )}
            <button className="lp-btn-report" onClick={openReportModal}>
              {IC.clipboard}
              Shift Report
            </button>
            <NotificationBell />
            <div className="lp-user-info">
              <span className="lp-user-name">{currentLeaderName}</span>
              <span className="lp-user-role">
                Leader · {dashboard?.lineName || "Loading..."}
              </span>
            </div>
          </div>
        </header>

        {/* ── Stepper ───────────────────────────────── */}
        <div className="lp-stepper">
          <div className="lp-step">
            <span className="lp-step-icon done">{IC.check}</span>
            <span className="lp-step-label">Order Confirmed</span>
          </div>
          <span className="lp-step-arrow done" />
          <div className="lp-step">
            <span className="lp-step-icon done">{IC.check}</span>
            <span className="lp-step-label">Production Schedule</span>
          </div>
          <span className="lp-step-arrow done" />
          <div className="lp-step">
            <span className="lp-step-icon active">3</span>
            <span className="lp-step-label">Leader Production</span>
          </div>
          <span className="lp-step-arrow" />
          <div className="lp-step">
            <span className="lp-step-icon">4</span>
            <span className="lp-step-label">Completed</span>
          </div>
        </div>

        {/* ── Summary Strip ─────────────────────────── */}
        {dashboard && (
          <div className="lp-summary-strip">
            <div className="lp-summary-card accent-cyan">
              <span className="lp-summary-value">
                {dashboard.todayProducedQuantity || 0}
              </span>
              <span className="lp-summary-label">Today's Output</span>
            </div>
            <div className="lp-summary-card accent-blue">
              <span className="lp-summary-value">
                {dashboard.activeScheduleCount || 0}
              </span>
              <span className="lp-summary-label">Active Schedules</span>
            </div>
            <div className="lp-summary-card accent-amber">
              <span className="lp-summary-value">
                {dashboard.todayDowntimeMinutes || 0}p
              </span>
              <span className="lp-summary-label">Downtime</span>
            </div>
            <div className="lp-summary-card accent-emerald">
              <span className="lp-summary-value">
                {dashboard.todayEfficiency || 0}%
              </span>
              <span className="lp-summary-label">Efficiency</span>
            </div>
          </div>
        )}

        {/* ── Loading ───────────────────────────────── */}
        {loading && (
          <div className="lp-loading">
            <div className="lp-spinner" />
            <span className="lp-loading-text">Loading data...</span>
          </div>
        )}

        {/* ── Not Assigned ──────────────────────────── */}
        {error && error === "NOT_ASSIGNED" && (
          <div className="lp-not-assigned">
            <div className="lp-not-assigned-icon">📋</div>
            <h3>Not Assigned to a Production Line</h3>
            <p>
              Your account has not been assigned to any production line. Please
              contact the <strong>Manager</strong> to get assigned.
            </p>
            <div className="lp-not-assigned-info">
              <span>
                👤 Name: <strong>{currentLeaderName}</strong>
              </span>
              <span>
                🔑 Employee ID:{" "}
                <strong>{currentUser?.employeeCode || "N/A"}</strong>
              </span>
            </div>
            <button className="lp-empty-btn" onClick={fetchData}>
              Check Again
            </button>
          </div>
        )}

        {/* ── Error Banner ──────────────────────────── */}
        {error && error !== "NOT_ASSIGNED" && (
          <div className="lp-error-banner">
            <span>
              {IC.alertTriangle} {error}
            </span>
            <button onClick={fetchData}>Retry</button>
          </div>
        )}

        {/* ── Filter Chips + Refresh ────────────────── */}
        {!loading && !error && (
          <div className="lp-toolbar">
            <div className="lp-filter-chips">
              {chips.map((c) => (
                <button
                  key={c.key}
                  className={`lp-chip ${activeTab === c.key ? "active" : ""}`}
                  onClick={() => setActiveTab(c.key)}
                >
                  {c.label}
                  <span className="lp-chip-count">{c.count}</span>
                </button>
              ))}
            </div>
            <div className="lp-toolbar-right">
              <button
                className="lp-btn-refresh"
                onClick={fetchData}
                title="Reload"
              >
                {IC.refresh}
              </button>
            </div>
          </div>
        )}

        {/* ── Schedule Cards ────────────────────────── */}
        {!loading && !error && (
          <div className="lp-schedule-list">
            {filteredSchedules.length === 0 ? (
              <div className="lp-empty-state">
                <div className="lp-empty-icon">{IC.inbox}</div>
                <p className="lp-empty-title">No production schedules</p>
                <p className="lp-empty-text">
                  No schedules found matching the current filter.
                </p>
              </div>
            ) : (
              filteredSchedules.map((schedule) => (
                <div key={schedule.scheduleId} className="lp-schedule-card">
                  {/* Card header */}
                  <div className="lp-sched-header">
                    <span className="lp-sched-id">
                      SCH-{schedule.scheduleId}
                    </span>
                    <span
                      className={`lp-status-badge ${getStatusBadgeClass(schedule.status)}`}
                    >
                      {getStatusLabel(schedule.status)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="lp-sched-title">
                    {schedule.orderInfo || "N/A"}
                  </h3>

                  {/* Details */}
                  <div className="lp-sched-details">
                    <div className="lp-sched-detail">
                      <span className="lp-sched-detail-label">Start</span>
                      <span className="lp-sched-detail-value">
                        {schedule.startTime
                          ? new Date(schedule.startTime).toLocaleString("en-US")
                          : "—"}
                      </span>
                    </div>
                    <div className="lp-sched-detail">
                      <span className="lp-sched-detail-label">End</span>
                      <span className="lp-sched-detail-value">
                        {schedule.endTime
                          ? new Date(schedule.endTime).toLocaleString("en-US")
                          : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Actions — SCHEDULED */}
                  {schedule.status === "SCHEDULED" && (
                    <div className="lp-sched-actions">
                      <button
                        className="lp-action-btn resume"
                        onClick={async () => {
                          try {
                            await leaderService.startSchedule(
                              schedule.scheduleId,
                            );
                            alert("▶️ Production started!");
                            fetchData();
                          } catch (err) {
                            alert(
                              `❌ Error: ${err.response?.data?.message || "Unable to start"}`,
                            );
                          }
                        }}
                      >
                        {IC.play} Start Production
                      </button>
                    </div>
                  )}

                  {/* Actions — RUNNING */}
                  {schedule.status === "RUNNING" && (
                    <div className="lp-sched-actions">
                      <button
                        className="lp-action-btn update"
                        onClick={() => openUpdateModal(schedule)}
                      >
                        {IC.barChart} Update Progress
                      </button>
                      <button
                        className="lp-action-btn incident"
                        onClick={() => openIncidentModal(schedule)}
                      >
                        {IC.alertTriangle} Report Incident
                      </button>
                      <button
                        className="lp-action-btn pause"
                        onClick={() => handlePauseSchedule(schedule.scheduleId)}
                      >
                        {IC.pause} Pause
                      </button>
                    </div>
                  )}

                  {/* Actions — PAUSED */}
                  {schedule.status === "PAUSED" && (
                    <div className="lp-sched-actions">
                      <button
                        className="lp-action-btn resume"
                        onClick={() =>
                          handleResumeSchedule(schedule.scheduleId)
                        }
                      >
                        {IC.play} Resume
                      </button>
                      <button
                        className="lp-action-btn incident"
                        onClick={() => openIncidentModal(schedule)}
                      >
                        {IC.alertTriangle} Report Incident
                      </button>
                    </div>
                  )}

                  {/* Completed badge */}
                  {schedule.status === "COMPLETED" && (
                    <div className="lp-sched-actions">
                      <span className="lp-completed-info">
                        {IC.check} Completed
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Recent Incidents ──────────────────────── */}
        {!loading && recentIncidents.length > 0 && (
          <div className="lp-incidents-section">
            <h2 className="lp-section-title">
              {IC.alertTriangle}
              Recent Incidents ({recentIncidents.length})
            </h2>
            <div className="lp-incidents-grid">
              {recentIncidents.map((incident) => (
                <div
                  key={incident.incidentId}
                  className={`lp-incident-card severity-${(incident.severity || "").toLowerCase()}`}
                >
                  <div className="lp-incident-header">
                    <span className="lp-incident-type">
                      {incidentTypeLabels[incident.incidentType] ||
                        incident.incidentType}
                    </span>
                    <span
                      className={`lp-severity-badge severity-${(incident.severity || "").toLowerCase()}`}
                    >
                      {incident.severity}
                    </span>
                  </div>
                  <div className="lp-incident-time">
                    {IC.clock}{" "}
                    {incident.timestamp
                      ? new Date(incident.timestamp).toLocaleString("en-US")
                      : "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════════
          MODALS
         ══════════════════════════════════════════════ */}

      {/* ── Update Progress Modal ───────────────────── */}
      {showUpdateModal && selectedSchedule && (
        <div
          className="lp-modal-overlay"
          onClick={() => setShowUpdateModal(false)}
        >
          <div className="lp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lp-modal-header">
              <h2>{IC.barChart} Update Progress</h2>
              <button
                className="lp-modal-close"
                onClick={() => setShowUpdateModal(false)}
              >
                {IC.close}
              </button>
            </div>
            <div className="lp-modal-body">
              <div className="lp-modal-info">
                <p>
                  <strong>Schedule:</strong> SCH-{selectedSchedule.scheduleId}
                </p>
                <p className="lp-modal-info-title">
                  {selectedSchedule.orderInfo || "N/A"}
                </p>
              </div>

              <div className="lp-form-group">
                <label>Completion Percentage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newPercentage}
                  onChange={(e) =>
                    setNewPercentage(parseInt(e.target.value) || 0)
                  }
                  className="lp-form-input"
                  placeholder="Enter percentage..."
                />
                <div className="lp-progress-bar">
                  <div
                    className="lp-progress-fill"
                    style={{
                      width: `${Math.min(100, newPercentage)}%`,
                      background:
                        newPercentage >= 100
                          ? "#059669"
                          : newPercentage >= 50
                            ? "#0891b2"
                            : "#d97706",
                    }}
                  />
                </div>
              </div>

              <div className="lp-form-group">
                <label>Notes</label>
                <textarea
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  className="lp-form-textarea"
                  placeholder="Enter notes about production progress..."
                  rows={3}
                />
              </div>

              <div className="lp-quick-notes">
                <label>Quick Notes:</label>
                <div className="lp-quick-note-buttons">
                  <button
                    onClick={() =>
                      setProgressNote("Production running smoothly")
                    }
                  >
                    ✅ Smooth
                  </button>
                  <button
                    onClick={() => setProgressNote("Minor issue resolved")}
                  >
                    ⚠️ Minor Issue
                  </button>
                  <button
                    onClick={() =>
                      setProgressNote("High productivity achieved")
                    }
                  >
                    🚀 High Productivity
                  </button>
                </div>
              </div>
            </div>
            <div className="lp-modal-footer">
              <button
                className="lp-btn-cancel"
                onClick={() => setShowUpdateModal(false)}
              >
                Cancel
              </button>
              <button
                className="lp-btn-confirm"
                onClick={handleUpdateProgress}
                disabled={newPercentage <= 0}
              >
                Update Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Incident Report Modal ───────────────────── */}
      {showIncidentModal && selectedSchedule && (
        <div
          className="lp-modal-overlay"
          onClick={() => setShowIncidentModal(false)}
        >
          <div className="lp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lp-modal-header incident">
              <h2>{IC.alertTriangle} Report Incident</h2>
              <button
                className="lp-modal-close"
                onClick={() => setShowIncidentModal(false)}
              >
                {IC.close}
              </button>
            </div>
            <div className="lp-modal-body">
              <div className="lp-modal-info">
                <p>
                  <strong>Schedule:</strong> SCH-{selectedSchedule.scheduleId}
                </p>
                <p className="lp-modal-info-title">
                  {selectedSchedule.orderInfo || "N/A"}
                </p>
              </div>

              <div className="lp-form-group">
                <label>Incident Type</label>
                <select
                  value={newIncident.incidentType}
                  onChange={(e) =>
                    setNewIncident({
                      ...newIncident,
                      incidentType: e.target.value,
                    })
                  }
                  className="lp-form-select"
                >
                  {incidentTypes.map((type) => (
                    <option key={type} value={type}>
                      {incidentTypeLabels[type] || type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lp-form-group">
                <label>Severity Level</label>
                <select
                  value={newIncident.severity}
                  onChange={(e) =>
                    setNewIncident({ ...newIncident, severity: e.target.value })
                  }
                  className="lp-form-select"
                >
                  <option value="LOW">Low - Minor impact</option>
                  <option value="MEDIUM">Medium - Affects productivity</option>
                  <option value="HIGH">High - Must stop production</option>
                </select>
              </div>

              <div className="lp-form-group">
                <label>Detailed Description *</label>
                <textarea
                  value={newIncident.description}
                  onChange={(e) =>
                    setNewIncident({
                      ...newIncident,
                      description: e.target.value,
                    })
                  }
                  className="lp-form-textarea"
                  placeholder="Describe the incident in detail..."
                  rows={4}
                  required
                />
              </div>
            </div>
            <div className="lp-modal-footer">
              <button
                className="lp-btn-cancel"
                onClick={() => setShowIncidentModal(false)}
              >
                Cancel
              </button>
              <button
                className="lp-btn-confirm danger"
                onClick={handleReportIncident}
                disabled={!newIncident.description}
              >
                Submit Incident Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Shift Report Modal ──────────────────────── */}
      {showReportModal && (
        <div
          className="lp-modal-overlay"
          onClick={() => setShowReportModal(false)}
        >
          <div className="lp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lp-modal-header">
              <h2>{IC.clipboard} End-of-Shift Report</h2>
              <button
                className="lp-modal-close"
                onClick={() => setShowReportModal(false)}
              >
                {IC.close}
              </button>
            </div>
            <div className="lp-modal-body">
              <div className="lp-form-group">
                <label>Work Shift</label>
                <select
                  value={shiftReport.shift}
                  onChange={(e) =>
                    setShiftReport({ ...shiftReport, shift: e.target.value })
                  }
                  className="lp-form-select"
                >
                  <option value="MORNING">Morning Shift</option>
                  <option value="AFTERNOON">Afternoon Shift</option>
                  <option value="NIGHT">Night Shift</option>
                </select>
              </div>

              <div className="lp-form-group">
                <label>Target Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={shiftReport.targetQuantity}
                  onChange={(e) =>
                    setShiftReport({
                      ...shiftReport,
                      targetQuantity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="lp-form-input"
                  placeholder="Enter target quantity..."
                />
              </div>

              <div className="lp-form-group">
                <label>Good Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={shiftReport.goodQuantity}
                  onChange={(e) =>
                    setShiftReport({
                      ...shiftReport,
                      goodQuantity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="lp-form-input"
                  placeholder="Enter good quantity..."
                />
              </div>

              <div className="lp-form-group">
                <label>Reject Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={shiftReport.rejectQuantity}
                  onChange={(e) =>
                    setShiftReport({
                      ...shiftReport,
                      rejectQuantity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="lp-form-input"
                  placeholder="Enter reject quantity..."
                />
              </div>

              <div className="lp-form-group">
                <label>Downtime (minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={shiftReport.downtimeMinutes}
                  onChange={(e) =>
                    setShiftReport({
                      ...shiftReport,
                      downtimeMinutes: parseInt(e.target.value) || 0,
                    })
                  }
                  className="lp-form-input"
                  placeholder="Enter downtime in minutes..."
                />
              </div>

              <div className="lp-form-group">
                <label>Notes</label>
                <textarea
                  value={shiftReport.notes}
                  onChange={(e) =>
                    setShiftReport({ ...shiftReport, notes: e.target.value })
                  }
                  className="lp-form-textarea"
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </div>
            <div className="lp-modal-footer">
              <button
                className="lp-btn-cancel"
                onClick={() => setShowReportModal(false)}
              >
                Cancel
              </button>
              <button
                className="lp-btn-confirm"
                onClick={handleSubmitReport}
                disabled={shiftReport.goodQuantity <= 0}
              >
                Submit Shift Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderProgress;
