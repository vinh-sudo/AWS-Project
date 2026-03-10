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
    MACHINE_FAILURE: "Máy hỏng",
    MATERIAL_SHORTAGE: "Thiếu nguyên liệu",
    QUALITY_ISSUE: "Chất lượng kém",
    SAFETY_INCIDENT: "An toàn lao động",
    LABOR_SHORTAGE: "Thiếu nhân công",
    OTHER: "Khác",
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
      return "Bạn không có quyền truy cập trang này.";
    }
    if (status === 401) {
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    }
    return message || "Không thể tải dữ liệu. Vui lòng thử lại.";
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
      alert("⏸️ Đã tạm dừng lịch sản xuất!");
      fetchData();
    } catch (err) {
      alert(`❌ Lỗi: ${err.response?.data?.message || "Không thể tạm dừng"}`);
    }
  };

  const handleResumeSchedule = async (scheduleId) => {
    try {
      await scheduleService.resumeSchedule(scheduleId);
      alert("▶️ Đã tiếp tục lịch sản xuất!");
      fetchData();
    } catch (err) {
      alert(`❌ Lỗi: ${err.response?.data?.message || "Không thể tiếp tục"}`);
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
      alert(`✅ ${result.message || "Đã cập nhật tiến độ!"}`);
      setShowUpdateModal(false);
      setSelectedSchedule(null);
      fetchData();
    } catch (err) {
      alert(`❌ Lỗi: ${err.response?.data?.message || "Không thể cập nhật"}`);
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
      alert("⚠️ Đã báo cáo sự cố thành công!");
      setShowIncidentModal(false);
      setSelectedSchedule(null);
      fetchData();
    } catch (err) {
      alert(
        `❌ Lỗi: ${err.response?.data?.message || "Không thể báo cáo sự cố"}`,
      );
    }
  };

  const handleSubmitReport = async () => {
    try {
      const result = await leaderService.submitReport(shiftReport);
      alert(`✅ ${result.message || "Đã gửi báo cáo ca thành công!"}`);
      setShowReportModal(false);
      fetchData();
    } catch (err) {
      alert(
        `❌ Lỗi: ${err.response?.data?.message || "Không thể gửi báo cáo"}`,
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
        return "Chờ SX";
      case "RUNNING":
        return "Đang chạy";
      case "COMPLETED":
        return "Hoàn thành";
      case "PAUSED":
        return "Tạm dừng";
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
    { key: "inProgress", label: "Đang sản xuất", count: inProgressCount },
    { key: "scheduled", label: "Chờ sản xuất", count: scheduledCount },
    { key: "onHold", label: "Tạm dừng", count: onHoldCount },
    { key: "completed", label: "Hoàn thành", count: completedCount },
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
              Cập nhật tiến độ sản xuất
            </h1>
            <p className="lp-header-subtitle">
              {dashboard?.lineName
                ? `${dashboard.lineName} — Hiệu suất hôm nay: ${dashboard.todayEfficiency || 0}%`
                : "Báo cáo sản lượng và sự cố cho từng lịch sản xuất"}
            </p>
          </div>
          <div className="lp-header-right">
            {totalIncidents > 0 && (
              <div className="lp-incident-badge">
                <span className="lp-incident-badge-count">
                  {totalIncidents}
                </span>
                Sự cố đang mở
              </div>
            )}
            <button className="lp-btn-report" onClick={openReportModal}>
              {IC.clipboard}
              Báo cáo ca
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
            <span className="lp-step-label">Đơn xác nhận</span>
          </div>
          <span className="lp-step-arrow done" />
          <div className="lp-step">
            <span className="lp-step-icon done">{IC.check}</span>
            <span className="lp-step-label">Lịch sản xuất</span>
          </div>
          <span className="lp-step-arrow done" />
          <div className="lp-step">
            <span className="lp-step-icon active">3</span>
            <span className="lp-step-label">Leader sản xuất</span>
          </div>
          <span className="lp-step-arrow" />
          <div className="lp-step">
            <span className="lp-step-icon">4</span>
            <span className="lp-step-label">Hoàn thành</span>
          </div>
        </div>

        {/* ── Summary Strip ─────────────────────────── */}
        {dashboard && (
          <div className="lp-summary-strip">
            <div className="lp-summary-card accent-cyan">
              <span className="lp-summary-value">
                {dashboard.todayProducedQuantity || 0}
              </span>
              <span className="lp-summary-label">SL hôm nay</span>
            </div>
            <div className="lp-summary-card accent-blue">
              <span className="lp-summary-value">
                {dashboard.activeScheduleCount || 0}
              </span>
              <span className="lp-summary-label">Lịch đang chạy</span>
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
              <span className="lp-summary-label">Hiệu suất</span>
            </div>
          </div>
        )}

        {/* ── Loading ───────────────────────────────── */}
        {loading && (
          <div className="lp-loading">
            <div className="lp-spinner" />
            <span className="lp-loading-text">Đang tải dữ liệu...</span>
          </div>
        )}

        {/* ── Not Assigned ──────────────────────────── */}
        {error && error === "NOT_ASSIGNED" && (
          <div className="lp-not-assigned">
            <div className="lp-not-assigned-icon">📋</div>
            <h3>Chưa được phân công dây chuyền</h3>
            <p>
              Tài khoản của bạn chưa được gán vào dây chuyền sản xuất nào. Vui
              lòng liên hệ <strong>Quản lý (Manager)</strong> để được phân công.
            </p>
            <div className="lp-not-assigned-info">
              <span>
                👤 Tên: <strong>{currentLeaderName}</strong>
              </span>
              <span>
                🔑 Mã NV: <strong>{currentUser?.employeeCode || "N/A"}</strong>
              </span>
            </div>
            <button className="lp-empty-btn" onClick={fetchData}>
              Kiểm tra lại
            </button>
          </div>
        )}

        {/* ── Error Banner ──────────────────────────── */}
        {error && error !== "NOT_ASSIGNED" && (
          <div className="lp-error-banner">
            <span>
              {IC.alertTriangle} {error}
            </span>
            <button onClick={fetchData}>Thử lại</button>
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
                title="Tải lại"
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
                <p className="lp-empty-title">Không có lịch sản xuất nào</p>
                <p className="lp-empty-text">
                  Không tìm thấy lịch sản xuất phù hợp với bộ lọc hiện tại.
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
                      <span className="lp-sched-detail-label">Bắt đầu</span>
                      <span className="lp-sched-detail-value">
                        {schedule.startTime
                          ? new Date(schedule.startTime).toLocaleString("vi-VN")
                          : "—"}
                      </span>
                    </div>
                    <div className="lp-sched-detail">
                      <span className="lp-sched-detail-label">Kết thúc</span>
                      <span className="lp-sched-detail-value">
                        {schedule.endTime
                          ? new Date(schedule.endTime).toLocaleString("vi-VN")
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
                            alert("▶️ Đã bắt đầu sản xuất!");
                            fetchData();
                          } catch (err) {
                            alert(
                              `❌ Lỗi: ${err.response?.data?.message || "Không thể bắt đầu"}`,
                            );
                          }
                        }}
                      >
                        {IC.play} Bắt đầu SX
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
                        {IC.barChart} Cập nhật tiến độ
                      </button>
                      <button
                        className="lp-action-btn incident"
                        onClick={() => openIncidentModal(schedule)}
                      >
                        {IC.alertTriangle} Báo cáo sự cố
                      </button>
                      <button
                        className="lp-action-btn pause"
                        onClick={() => handlePauseSchedule(schedule.scheduleId)}
                      >
                        {IC.pause} Tạm dừng
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
                        {IC.play} Tiếp tục
                      </button>
                      <button
                        className="lp-action-btn incident"
                        onClick={() => openIncidentModal(schedule)}
                      >
                        {IC.alertTriangle} Báo cáo sự cố
                      </button>
                    </div>
                  )}

                  {/* Completed badge */}
                  {schedule.status === "COMPLETED" && (
                    <div className="lp-sched-actions">
                      <span className="lp-completed-info">
                        {IC.check} Hoàn thành
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
              Sự cố gần đây ({recentIncidents.length})
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
                      ? new Date(incident.timestamp).toLocaleString("vi-VN")
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
              <h2>{IC.barChart} Cập nhật tiến độ</h2>
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
                  <strong>Lịch:</strong> SCH-{selectedSchedule.scheduleId}
                </p>
                <p className="lp-modal-info-title">
                  {selectedSchedule.orderInfo || "N/A"}
                </p>
              </div>

              <div className="lp-form-group">
                <label>Phần trăm hoàn thành (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newPercentage}
                  onChange={(e) =>
                    setNewPercentage(parseInt(e.target.value) || 0)
                  }
                  className="lp-form-input"
                  placeholder="Nhập phần trăm..."
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
                <label>Ghi chú</label>
                <textarea
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  className="lp-form-textarea"
                  placeholder="Nhập ghi chú về tiến độ sản xuất..."
                  rows={3}
                />
              </div>

              <div className="lp-quick-notes">
                <label>Ghi chú nhanh:</label>
                <div className="lp-quick-note-buttons">
                  <button onClick={() => setProgressNote("Sản xuất suôn sẻ")}>
                    ✅ Suôn sẻ
                  </button>
                  <button
                    onClick={() =>
                      setProgressNote("Có vấn đề nhỏ đã khắc phục")
                    }
                  >
                    ⚠️ Vấn đề nhỏ
                  </button>
                  <button onClick={() => setProgressNote("Đạt năng suất cao")}>
                    🚀 Năng suất cao
                  </button>
                </div>
              </div>
            </div>
            <div className="lp-modal-footer">
              <button
                className="lp-btn-cancel"
                onClick={() => setShowUpdateModal(false)}
              >
                Hủy
              </button>
              <button
                className="lp-btn-confirm"
                onClick={handleUpdateProgress}
                disabled={newPercentage <= 0}
              >
                Cập nhật tiến độ
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
              <h2>{IC.alertTriangle} Báo cáo sự cố</h2>
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
                  <strong>Lịch:</strong> SCH-{selectedSchedule.scheduleId}
                </p>
                <p className="lp-modal-info-title">
                  {selectedSchedule.orderInfo || "N/A"}
                </p>
              </div>

              <div className="lp-form-group">
                <label>Loại sự cố</label>
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
                <label>Mức độ nghiêm trọng</label>
                <select
                  value={newIncident.severity}
                  onChange={(e) =>
                    setNewIncident({ ...newIncident, severity: e.target.value })
                  }
                  className="lp-form-select"
                >
                  <option value="LOW">Thấp - Không ảnh hưởng nhiều</option>
                  <option value="MEDIUM">
                    Trung bình - Ảnh hưởng năng suất
                  </option>
                  <option value="HIGH">Cao - Phải dừng sản xuất</option>
                </select>
              </div>

              <div className="lp-form-group">
                <label>Mô tả chi tiết *</label>
                <textarea
                  value={newIncident.description}
                  onChange={(e) =>
                    setNewIncident({
                      ...newIncident,
                      description: e.target.value,
                    })
                  }
                  className="lp-form-textarea"
                  placeholder="Mô tả chi tiết sự cố..."
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
                Hủy
              </button>
              <button
                className="lp-btn-confirm danger"
                onClick={handleReportIncident}
                disabled={!newIncident.description}
              >
                Gửi báo cáo sự cố
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
              <h2>{IC.clipboard} Báo cáo cuối ca</h2>
              <button
                className="lp-modal-close"
                onClick={() => setShowReportModal(false)}
              >
                {IC.close}
              </button>
            </div>
            <div className="lp-modal-body">
              <div className="lp-form-group">
                <label>Ca làm việc</label>
                <select
                  value={shiftReport.shift}
                  onChange={(e) =>
                    setShiftReport({ ...shiftReport, shift: e.target.value })
                  }
                  className="lp-form-select"
                >
                  <option value="MORNING">Ca sáng</option>
                  <option value="AFTERNOON">Ca chiều</option>
                  <option value="NIGHT">Ca đêm</option>
                </select>
              </div>

              <div className="lp-form-group">
                <label>Sản lượng mục tiêu</label>
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
                  placeholder="Nhập sản lượng mục tiêu..."
                />
              </div>

              <div className="lp-form-group">
                <label>Sản lượng đạt</label>
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
                  placeholder="Nhập sản lượng đạt..."
                />
              </div>

              <div className="lp-form-group">
                <label>Sản lượng lỗi</label>
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
                  placeholder="Nhập sản lượng lỗi..."
                />
              </div>

              <div className="lp-form-group">
                <label>Thời gian dừng (phút)</label>
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
                  placeholder="Nhập thời gian dừng..."
                />
              </div>

              <div className="lp-form-group">
                <label>Ghi chú</label>
                <textarea
                  value={shiftReport.notes}
                  onChange={(e) =>
                    setShiftReport({ ...shiftReport, notes: e.target.value })
                  }
                  className="lp-form-textarea"
                  placeholder="Ghi chú thêm..."
                  rows={3}
                />
              </div>
            </div>
            <div className="lp-modal-footer">
              <button
                className="lp-btn-cancel"
                onClick={() => setShowReportModal(false)}
              >
                Hủy
              </button>
              <button
                className="lp-btn-confirm"
                onClick={handleSubmitReport}
                disabled={shiftReport.goodQuantity <= 0}
              >
                Gửi báo cáo ca
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderProgress;
