// ============================================================================
// LeaderProgress — Connected to backend LeaderController API
// Endpoints used:
//   GET  /api/leader/dashboard    → overview + KPI counters
//   GET  /api/leader/schedules    → schedule list
//   POST /api/leader/incident     → report incident
//   POST /api/leader/report       → submit end-of-shift report
// ============================================================================
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import LeaderSidebar from "../../components/LeaderSidebar/LeaderSidebar";
import authService from "../../services/authService";
import leaderService from "../../services/leaderService";
import scheduleService from "../../services/scheduleService";
import PageLoading from "../../components/PageLoading/PageLoading";
import "./LeaderProgress.css";

const SHIFT_REPORT_DRAFT_KEY = "leader_shift_report_draft_v1";

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
  const { scheduleId: focusedScheduleId } = useParams();
  const [activeTab, setActiveTab] = useState("inProgress");
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Current leader info from auth
  const currentUser = authService.getCurrentUser();
  const currentLeaderName = currentUser?.fullName || "Leader";

  // Dashboard data from API
  const [dashboard, setDashboard] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [scheduleDocuments, setScheduleDocuments] = useState({});
  const [localProgressBySchedule, setLocalProgressBySchedule] = useState({});
  const [localOrderItemProgressBySchedule, setLocalOrderItemProgressBySchedule] =
    useState({});

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

  const createDefaultShiftReport = (scheduleId = "") => ({
    scheduleId,
    shift: "MORNING",
    targetQuantity: 0,
    goodQuantity: 0,
    rejectQuantity: 0,
    downtimeMinutes: 0,
    notes: "",
  });

  const loadShiftReportDraft = () => {
    try {
      const rawDraft = sessionStorage.getItem(SHIFT_REPORT_DRAFT_KEY);
      if (!rawDraft) {
        return createDefaultShiftReport();
      }

      const parsed = JSON.parse(rawDraft);
      return {
        ...createDefaultShiftReport(),
        ...parsed,
      };
    } catch {
      return createDefaultShiftReport();
    }
  };

  const saveShiftReportDraft = (draft) => {
    sessionStorage.setItem(SHIFT_REPORT_DRAFT_KEY, JSON.stringify(draft));
  };

  const clearShiftReportDraft = () => {
    sessionStorage.removeItem(SHIFT_REPORT_DRAFT_KEY);
  };

  // End-of-shift report state
  const [shiftReport, setShiftReport] = useState(() => loadShiftReportDraft());

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
    if (status === 500) {
      return message || "Server error occurred. Please try again later.";
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

      const dashboardRejected = dashboardRes.status === "rejected";
      const schedulesRejected = schedulesRes.status === "rejected";

      if (dashboardRejected || schedulesRejected) {
        const priorityReason = schedulesRejected
          ? schedulesRes.reason
          : dashboardRes.reason;
        const errorMsg = getErrorMessage(priorityReason);

        setError(errorMsg === "NOT_ASSIGNED" ? "NOT_ASSIGNED" : errorMsg);

        if (dashboardRejected || schedulesRejected) {
          console.warn("Leader API partial/full failure", {
            dashboardRejected,
            schedulesRejected,
            dashboardError: dashboardRejected ? dashboardRes.reason : null,
            schedulesError: schedulesRejected ? schedulesRes.reason : null,
          });
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

  // Resume schedule
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
      case "onHold":
        return schedules.filter((s) => s.status === "PAUSED");
      default:
        return schedules;
    }
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

  const openReportModal = (schedule = null) => {
    setShiftReport((prev) => {
      if (schedule?.scheduleId) {
        const scheduleTarget = getScheduleTargetQuantity(schedule);
        const next = {
          ...prev,
          scheduleId: String(schedule.scheduleId),
          targetQuantity: scheduleTarget ?? 0,
        };
        saveShiftReportDraft(next);
        return next;
      }
      return prev;
    });
    setSelectedSchedule(schedule);
    setShowReportModal(true);
  };

  useEffect(() => {
    if (!showReportModal) {
      return;
    }

    saveShiftReportDraft(shiftReport);
  }, [shiftReport, showReportModal]);

  const openDocumentsModal = (schedule) => {
    const docsFromSchedule = schedule?.documents || [];
    const docsFromStart = scheduleDocuments[schedule.scheduleId] || [];
    const docs = docsFromSchedule.length > 0 ? docsFromSchedule : docsFromStart;
    setSelectedSchedule(schedule);
    setSelectedDocuments(docs);
    setShowDocumentModal(true);
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
      if (error) {
        alert("❌ Cannot submit while schedule data failed to load. Please fix access and retry.");
        return;
      }

      const selectedScheduleFromList = schedules.find(
        (item) => String(item.scheduleId) === String(shiftReport.scheduleId),
      );

      if (!selectedScheduleFromList) {
        alert("❌ Invalid schedule. Please reload data and choose a schedule again.");
        return;
      }

      if (!["RUNNING", "PAUSED"].includes(selectedScheduleFromList.status)) {
        alert("❌ Report can only be submitted for RUNNING or PAUSED schedules.");
        return;
      }

      const payload = {
        scheduleId: Number(shiftReport.scheduleId),
        shift: shiftReport.shift,
        targetQuantity: Number(shiftReport.targetQuantity) || 0,
        goodQuantity: Number(shiftReport.goodQuantity) || 0,
        rejectQuantity: Number(shiftReport.rejectQuantity) || 0,
        downtimeMinutes: Number(shiftReport.downtimeMinutes) || 0,
        notes: shiftReport.notes || undefined,
      };

      const result = await leaderService.submitReport(payload);

      if (result?.scheduleId && result?.scheduleCompletionPercentage != null) {
        setLocalProgressBySchedule((prev) => ({
          ...prev,
          [result.scheduleId]: Number(result.scheduleCompletionPercentage),
        }));
      }

      if (result?.scheduleId && result?.orderItemCompletionPercentage != null) {
        setLocalOrderItemProgressBySchedule((prev) => ({
          ...prev,
          [result.scheduleId]: Number(result.orderItemCompletionPercentage),
        }));
      }

      alert(`✅ ${result.message || "Shift report submitted successfully!"}`);
      setShowReportModal(false);
      setSelectedSchedule(null);
      const cleared = createDefaultShiftReport();
      setShiftReport(cleared);
      clearShiftReportDraft();
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

  const getScheduleProgressValue = (schedule) => {
    if (
      Object.prototype.hasOwnProperty.call(
        localProgressBySchedule,
        schedule.scheduleId,
      )
    ) {
      return localProgressBySchedule[schedule.scheduleId];
    }

    if (schedule?.percentage != null) {
      return Number(schedule.percentage);
    }

    return null;
  };

  const getOrderProgressValue = (schedule) => {
    if (schedule?.orderCompletionPercentage == null) {
      return null;
    }
    return Number(schedule.orderCompletionPercentage);
  };

  const getOrderItemProgressValue = (schedule) => {
    if (
      Object.prototype.hasOwnProperty.call(
        localOrderItemProgressBySchedule,
        schedule.scheduleId,
      )
    ) {
      return localOrderItemProgressBySchedule[schedule.scheduleId];
    }

    if (schedule?.orderItemCompletionPercentage != null) {
      return Number(schedule.orderItemCompletionPercentage);
    }

    return null;
  };

  const getScheduleTargetQuantity = (schedule) => {
    if (!schedule) return null;

    const candidates = [
      schedule.targetQuantity,
      schedule.targetQty,
      schedule.plannedQty,
      schedule.plannedQuantity,
      schedule.planQty,
      schedule.quantity,
      schedule.orderQuantity,
      schedule.requiredQuantity,
      schedule.totalQuantity,
      schedule.orderItemQuantity,
      schedule.orderItem?.plannedQty,
      schedule.orderItem?.quantity,
      schedule.orderItem?.targetQuantity,
    ];

    const firstValid = candidates.find((value) => {
      const num = Number(value);
      return Number.isFinite(num) && num >= 0;
    });

    return firstValid == null ? null : Number(firstValid);
  };

  const getPreviousStageGoodQuantity = (schedule) => {
    const candidates = [
      schedule?.previousStageGoodQuantity,
      schedule?.previousGoodQuantity,
      schedule?.prevStageGoodQty,
    ];

    const firstValid = candidates.find((value) => {
      const num = Number(value);
      return Number.isFinite(num) && num >= 0;
    });

    return firstValid == null ? null : Number(firstValid);
  };

  const filteredSchedules = getFilteredSchedules();
  const scheduledCount = schedules.filter(
    (s) => s.status === "SCHEDULED",
  ).length;
  const inProgressCount = schedules.filter(
    (s) => s.status === "RUNNING",
  ).length;
  const onHoldCount = schedules.filter((s) => s.status === "PAUSED").length;
  const totalIncidents = dashboard?.unresolvedIncidentCount || 0;
  const hasIncidentDetails = Array.isArray(dashboard?.recentIncidents);
  const recentIncidents = hasIncidentDetails ? dashboard.recentIncidents : [];

  /* ===== Filter chip config ===== */
  const chips = [
    { key: "inProgress", label: "In Production", count: inProgressCount },
    { key: "scheduled", label: "Scheduled", count: scheduledCount },
    { key: "onHold", label: "Paused", count: onHoldCount },
  ];

  useEffect(() => {
    if (!focusedScheduleId || schedules.length === 0) {
      return;
    }

    const schedule = schedules.find(
      (item) => String(item.scheduleId) === String(focusedScheduleId),
    );

    if (!schedule) {
      return;
    }

    if (schedule.status === "SCHEDULED") {
      setActiveTab("scheduled");
    } else if (schedule.status === "PAUSED") {
      setActiveTab("onHold");
    } else {
      setActiveTab("inProgress");
    }

    requestAnimationFrame(() => {
      const target = document.getElementById(`schedule-${schedule.scheduleId}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }, [focusedScheduleId, schedules]);

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
              Production Execution & Reporting
            </h1>
            <p className="lp-header-subtitle">
              {dashboard?.lineName
                ? `${dashboard.lineName} — Today's efficiency: ${dashboard.todayEfficiency || 0}%`
                : "Log shift output and incidents by schedule. Progress is auto-calculated from submitted reports."}
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
              Log Shift Output
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
                {dashboard.todayDowntimeMinutes || 0}m
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
        {loading && <PageLoading variant="inline" text="Loading data..." />}

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
              filteredSchedules.map((schedule) => {
                const scheduleProgress = getScheduleProgressValue(schedule);
                const orderItemProgress = getOrderItemProgressValue(schedule);
                const orderProgress = getOrderProgressValue(schedule);
                const targetQuantity = getScheduleTargetQuantity(schedule);
                const previousStageGoodQuantity =
                  getPreviousStageGoodQuantity(schedule);

                return (
                  <div
                  id={`schedule-${schedule.scheduleId}`}
                  key={schedule.scheduleId}
                  className="lp-schedule-card"
                >
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
                    {scheduleProgress != null && (
                      <div className="lp-sched-detail">
                        <span className="lp-sched-detail-label">Progress</span>
                        <span className="lp-sched-detail-value">
                          {scheduleProgress}%
                        </span>
                      </div>
                    )}
                    {orderProgress != null && (
                      <div className="lp-sched-detail">
                        <span className="lp-sched-detail-label">
                          Order Completion
                        </span>
                        <span className="lp-sched-detail-value">
                          {orderProgress}%
                        </span>
                      </div>
                    )}
                    {orderItemProgress != null && (
                      <div className="lp-sched-detail">
                        <span className="lp-sched-detail-label">
                          Item Completion
                        </span>
                        <span className="lp-sched-detail-value">
                          {orderItemProgress}%
                        </span>
                      </div>
                    )}
                    {targetQuantity != null && (
                      <div className="lp-sched-detail">
                        <span className="lp-sched-detail-label">Target Quantity</span>
                        <span className="lp-sched-detail-value">
                          {targetQuantity.toLocaleString()} units
                        </span>
                      </div>
                    )}
                    {previousStageGoodQuantity != null && (
                      <div className="lp-sched-detail">
                        <span className="lp-sched-detail-label">
                          Previous Stage Good
                        </span>
                        <span className="lp-sched-detail-value">
                          {previousStageGoodQuantity.toLocaleString()} units
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions — SCHEDULED */}
                  {schedule.status === "SCHEDULED" && (
                    <div className="lp-sched-actions">
                      <button
                        className="lp-action-btn resume"
                        onClick={async () => {
                          try {
                            const startResult =
                              await leaderService.startSchedule(
                                schedule.scheduleId,
                              );

                            if (
                              Array.isArray(startResult?.documents) &&
                              startResult.documents.length > 0
                            ) {
                              setScheduleDocuments((prev) => ({
                                ...prev,
                                [schedule.scheduleId]: startResult.documents,
                              }));
                            }

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
                        className="lp-action-btn report"
                        onClick={() => openReportModal(schedule)}
                      >
                        {IC.clipboard} Log Production Output
                      </button>
                      {!!(
                        (schedule.documents && schedule.documents.length > 0) ||
                        (scheduleDocuments[schedule.scheduleId] &&
                          scheduleDocuments[schedule.scheduleId].length > 0)
                      ) && (
                        <button
                          className="lp-action-btn documents"
                          onClick={() => openDocumentsModal(schedule)}
                        >
                          {IC.clipboard} View Documents
                        </button>
                      )}
                      <button
                        className="lp-action-btn incident"
                        onClick={() => openIncidentModal(schedule)}
                      >
                        {IC.alertTriangle} Report Incident
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
                      {!!(
                        (schedule.documents && schedule.documents.length > 0) ||
                        (scheduleDocuments[schedule.scheduleId] &&
                          scheduleDocuments[schedule.scheduleId].length > 0)
                      ) && (
                        <button
                          className="lp-action-btn documents"
                          onClick={() => openDocumentsModal(schedule)}
                        >
                          {IC.clipboard} View Documents
                        </button>
                      )}
                      <button
                        className="lp-action-btn report"
                        onClick={() => openReportModal(schedule)}
                      >
                        {IC.clipboard} Log Shift Output
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
                );
              })
            )}
          </div>
        )}

        {/* ── Incident detail availability note ─────── */}
        {!loading && totalIncidents > 0 && !hasIncidentDetails && (
          <div className="lp-error-banner">
            <span>
              {IC.alertTriangle} There are {totalIncidents} open incidents.
              Backend dashboard currently returns count only (no detail list).
            </span>
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
              <h2>{IC.clipboard} Production Output Report</h2>
              <button
                className="lp-modal-close"
                onClick={() => setShowReportModal(false)}
              >
                {IC.close}
              </button>
            </div>
            <div className="lp-modal-body">
              <div className="lp-form-group">
                <label>Production Schedule *</label>
                <select
                  value={shiftReport.scheduleId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const schedule = schedules.find(
                      (item) => String(item.scheduleId) === selectedId,
                    );
                    const scheduleTarget = getScheduleTargetQuantity(schedule);

                    setShiftReport({
                      ...shiftReport,
                      scheduleId: selectedId,
                      targetQuantity: scheduleTarget ?? 0,
                    });
                    setSelectedSchedule(schedule || null);
                  }}
                  className="lp-form-select"
                >
                  <option value="">Select schedule...</option>
                  {schedules
                    .filter((schedule) =>
                      ["RUNNING", "PAUSED"].includes(schedule.status),
                    )
                    .map((schedule) => (
                      <option
                        key={schedule.scheduleId}
                        value={schedule.scheduleId}
                      >
                        SCH-{schedule.scheduleId} - {schedule.orderInfo || "N/A"}
                        {getScheduleTargetQuantity(schedule) != null
                          ? ` (Target: ${getScheduleTargetQuantity(schedule).toLocaleString()})`
                          : ""}
                      </option>
                    ))}
                </select>
                <p className="lp-inline-help">
                  Progress percentage is computed by backend from cumulative
                  reported output.
                </p>
                <p className="lp-inline-help">Draft is auto-saved while you type.</p>
              </div>

              {selectedSchedule &&
                String(selectedSchedule.scheduleId) ===
                  String(shiftReport.scheduleId) && (
                  <div className="lp-modal-info">
                    <p>
                      <strong>Schedule:</strong> SCH-{selectedSchedule.scheduleId}
                    </p>
                    <p className="lp-modal-info-title">
                      {selectedSchedule.orderInfo || "N/A"}
                    </p>
                  </div>
                )}

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
                {selectedSchedule && getScheduleTargetQuantity(selectedSchedule) != null && (
                  <p className="lp-inline-help">
                    Manager target: {getScheduleTargetQuantity(selectedSchedule).toLocaleString()} units
                  </p>
                )}
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
                disabled={
                  !!error ||
                  !shiftReport.scheduleId ||
                  shiftReport.targetQuantity < 0 ||
                  shiftReport.goodQuantity < 0 ||
                  shiftReport.rejectQuantity < 0 ||
                  (shiftReport.downtimeMinutes ?? 0) < 0
                }
              >
                Submit Shift Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Documents Modal ────────────────────────── */}
      {showDocumentModal && selectedSchedule && (
        <div
          className="lp-modal-overlay"
          onClick={() => setShowDocumentModal(false)}
        >
          <div className="lp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lp-modal-header">
              <h2>{IC.clipboard} Production Documents</h2>
              <button
                className="lp-modal-close"
                onClick={() => setShowDocumentModal(false)}
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

              {selectedDocuments.length === 0 ? (
                <div className="lp-empty-state">
                  <p className="lp-empty-title">No documents available</p>
                  <p className="lp-empty-text">
                    No POM/SOP documents were returned for this schedule.
                  </p>
                </div>
              ) : (
                <div className="lp-incidents-grid">
                  {selectedDocuments.map((doc) => {
                    const label =
                      doc.fileName || doc.documentName || "Document";
                    const link = doc.url || doc.fileUrl || doc.downloadUrl;

                    return (
                      <div
                        key={doc.id || `${label}-${link || "nolink"}`}
                        className="lp-incident-card"
                      >
                        <div className="lp-incident-header">
                          <span className="lp-incident-type">{label}</span>
                        </div>
                        <div className="lp-incident-time">
                          {link ? (
                            <a href={link} target="_blank" rel="noreferrer">
                              Open document
                            </a>
                          ) : (
                            "No link available"
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="lp-modal-footer">
              <button
                className="lp-btn-cancel"
                onClick={() => setShowDocumentModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderProgress;
