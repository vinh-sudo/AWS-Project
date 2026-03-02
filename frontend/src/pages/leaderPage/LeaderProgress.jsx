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
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import authService from "../../services/authService";
import leaderService from "../../services/leaderService";
import imsLogo from "../../assets/ims2.jpg";
import "./LeaderProgress.css";

const LeaderProgress = () => {
  const navigate = useNavigate();
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

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardRes, schedulesRes] = await Promise.all([
        leaderService.getDashboard(),
        leaderService.getMySchedules(),
      ]);
      setDashboard(dashboardRes);
      setSchedules(schedulesRes || []);
    } catch (err) {
      console.error("Error fetching leader data:", err);
      setError(err.response?.data?.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter based on active tab
  const getFilteredSchedules = () => {
    switch (activeTab) {
      case "scheduled":
        return schedules.filter(
          (s) => s.status === "SCHEDULED" || s.status === "Scheduled",
        );
      case "inProgress":
        return schedules.filter(
          (s) =>
            s.status === "ACTIVE" ||
            s.status === "IN_PROGRESS" ||
            s.status === "In Production",
        );
      case "completed":
        return schedules.filter(
          (s) => s.status === "COMPLETED" || s.status === "Completed",
        );
      case "onHold":
        return schedules.filter(
          (s) => s.status === "PAUSED" || s.status === "On Hold",
        );
      default:
        return schedules;
    }
  };

  const dispatch = useDispatch();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
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
      fetchData(); // Reload data
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

  const getStatusClass = (status) => {
    switch (status) {
      case "SCHEDULED":
      case "Scheduled":
        return "status-scheduled";
      case "ACTIVE":
      case "IN_PROGRESS":
      case "In Production":
        return "status-production";
      case "COMPLETED":
      case "Completed":
        return "status-completed";
      case "PAUSED":
      case "On Hold":
        return "status-hold";
      default:
        return "";
    }
  };

  const filteredSchedules = getFilteredSchedules();
  const scheduledCount = schedules.filter(
    (s) => s.status === "SCHEDULED" || s.status === "Scheduled",
  ).length;
  const inProgressCount = schedules.filter(
    (s) =>
      s.status === "ACTIVE" ||
      s.status === "IN_PROGRESS" ||
      s.status === "In Production",
  ).length;
  const completedCount = schedules.filter(
    (s) => s.status === "COMPLETED" || s.status === "Completed",
  ).length;
  const onHoldCount = schedules.filter(
    (s) => s.status === "PAUSED" || s.status === "On Hold",
  ).length;
  const totalIncidents = dashboard?.unresolvedIncidentCount || 0;

  return (
    <div className="leader-progress-container">
      {/* Sidebar */}
      <aside className="leader-sidebar">
        <div className="sidebar-header">
          <img src={imsLogo} alt="IMS Logo" className="sidebar-logo" />
          <span className="sidebar-title">IMS Leader</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item active">
            <span className="nav-icon">📊</span>
            <span>Progress Update</span>
          </div>
          <div
            className="nav-item"
            onClick={() => navigate("/leader/task-assignment")}
          >
            <span className="nav-icon">📋</span>
            <span>Internal Notes</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="nav-item logout" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span>Logout</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="leader-main">
        {/* Header */}
        <header className="leader-header">
          <div className="header-left">
            <h1>📊 Cập nhật tiến độ sản xuất</h1>
            <p>
              {dashboard?.lineName
                ? `${dashboard.lineName} — Hiệu suất hôm nay: ${dashboard.todayEfficiency || 0}%`
                : "Báo cáo sản lượng và sự cố cho từng lịch sản xuất"}
            </p>
          </div>
          <div className="header-right">
            {totalIncidents > 0 && (
              <div className="incident-badge">
                <span className="incident-count">{totalIncidents}</span>
                <span>Sự cố đang mở</span>
              </div>
            )}
            <button className="btn-report-shift" onClick={openReportModal}>
              📝 Báo cáo ca
            </button>
            <NotificationBell />
            <div className="user-info">
              <span className="user-name">{currentLeaderName}</span>
              <span className="user-role">
                Leader - {dashboard?.lineName || "Loading..."}
              </span>
            </div>
          </div>
        </header>

        {/* Workflow Info */}
        <div className="workflow-info">
          <div className="workflow-step">
            <span className="step-icon done">✓</span>
            <span className="step-label">Đơn xác nhận</span>
          </div>
          <span className="workflow-arrow">→</span>
          <div className="workflow-step">
            <span className="step-icon done">✓</span>
            <span className="step-label">Lịch sản xuất</span>
          </div>
          <span className="workflow-arrow">→</span>
          <div className="workflow-step">
            <span className="step-icon active">3</span>
            <span className="step-label">Leader sản xuất</span>
          </div>
          <span className="workflow-arrow">→</span>
          <div className="workflow-step">
            <span className="step-icon">4</span>
            <span className="step-label">Hoàn thành</span>
          </div>
        </div>

        {/* Stats Row */}
        {dashboard && (
          <div className="stats-row">
            <div className="stat-card progress">
              <span className="stat-number">
                {dashboard.todayProducedQuantity || 0}
              </span>
              <span className="stat-label">SL hôm nay</span>
            </div>
            <div className="stat-card scheduled">
              <span className="stat-number">
                {dashboard.activeScheduleCount || 0}
              </span>
              <span className="stat-label">Lịch đang chạy</span>
            </div>
            <div className="stat-card hold">
              <span className="stat-number">
                {dashboard.todayDowntimeMinutes || 0}p
              </span>
              <span className="stat-label">Downtime</span>
            </div>
            <div className="stat-card completed">
              <span className="stat-number">
                {dashboard.todayEfficiency || 0}%
              </span>
              <span className="stat-label">Hiệu suất</span>
            </div>
          </div>
        )}

        {/* Loading / Error */}
        {loading && (
          <div className="empty-state">
            <span>⏳</span>
            <p>Đang tải dữ liệu...</p>
          </div>
        )}
        {error && (
          <div className="empty-state">
            <span>⚠️</span>
            <p>{error}</p>
            <button className="btn-update" onClick={fetchData}>
              Thử lại
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === "inProgress" ? "active" : ""}`}
            onClick={() => setActiveTab("inProgress")}
          >
            Đang sản xuất ({inProgressCount})
          </button>
          <button
            className={`tab-btn ${activeTab === "scheduled" ? "active" : ""}`}
            onClick={() => setActiveTab("scheduled")}
          >
            Chờ sản xuất ({scheduledCount})
          </button>
          <button
            className={`tab-btn ${activeTab === "onHold" ? "active" : ""}`}
            onClick={() => setActiveTab("onHold")}
          >
            Tạm dừng ({onHoldCount})
          </button>
          <button
            className={`tab-btn ${activeTab === "completed" ? "active" : ""}`}
            onClick={() => setActiveTab("completed")}
          >
            Hoàn thành ({completedCount})
          </button>
        </div>

        {/* Schedule Cards */}
        {!loading && !error && (
          <div className="tasks-list">
            {filteredSchedules.length === 0 ? (
              <div className="empty-state">
                <span>📭</span>
                <p>Không có lịch sản xuất nào</p>
              </div>
            ) : (
              filteredSchedules.map((schedule) => (
                <div
                  key={schedule.scheduleId}
                  className={`task-card ${(schedule.status || "").replace(/[ _]/g, "-").toLowerCase()}`}
                >
                  <div className="task-header">
                    <div className="task-id-priority">
                      <span className="task-id">SCH-{schedule.scheduleId}</span>
                    </div>
                    <span
                      className={`status-badge ${getStatusClass(schedule.status)}`}
                    >
                      {schedule.status}
                    </span>
                  </div>

                  <h3 className="task-title">{schedule.orderInfo || "N/A"}</h3>

                  <div className="task-details">
                    <div className="detail-item">
                      <span className="detail-label">Bắt đầu</span>
                      <span className="detail-value">
                        {schedule.startTime
                          ? new Date(schedule.startTime).toLocaleString("vi-VN")
                          : "—"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Kết thúc</span>
                      <span className="detail-value">
                        {schedule.endTime
                          ? new Date(schedule.endTime).toLocaleString("vi-VN")
                          : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {(schedule.status === "ACTIVE" ||
                    schedule.status === "IN_PROGRESS" ||
                    schedule.status === "In Production") && (
                    <div className="task-actions">
                      <button
                        className="btn-update"
                        onClick={() => openUpdateModal(schedule)}
                      >
                        📊 Cập nhật tiến độ
                      </button>
                      <button
                        className="btn-incident"
                        onClick={() => openIncidentModal(schedule)}
                      >
                        ⚠️ Báo cáo sự cố
                      </button>
                    </div>
                  )}

                  {(schedule.status === "COMPLETED" ||
                    schedule.status === "Completed") && (
                    <div className="completed-info">
                      <span>✅ Hoàn thành</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Update Progress Modal */}
      {showUpdateModal && selectedSchedule && (
        <div
          className="modal-overlay"
          onClick={() => setShowUpdateModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 Cập nhật tiến độ</h2>
              <button
                className="modal-close"
                onClick={() => setShowUpdateModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-task-info">
                <p>
                  <strong>Lịch:</strong> SCH-{selectedSchedule.scheduleId}
                </p>
                <p className="task-title-modal">
                  {selectedSchedule.orderInfo || "N/A"}
                </p>
              </div>

              <div className="form-group">
                <label>Phần trăm hoàn thành (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newPercentage}
                  onChange={(e) =>
                    setNewPercentage(parseInt(e.target.value) || 0)
                  }
                  className="form-input"
                  placeholder="Nhập phần trăm..."
                />
                <div className="progress-bar" style={{ marginTop: 8 }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, newPercentage)}%`,
                      background:
                        newPercentage >= 100
                          ? "#27ae60"
                          : newPercentage >= 50
                            ? "#2ecc71"
                            : "#f39c12",
                    }}
                  ></div>
                </div>
              </div>

              <div className="form-group">
                <label>Ghi chú</label>
                <textarea
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  className="form-textarea"
                  placeholder="Nhập ghi chú về tiến độ sản xuất..."
                  rows={3}
                />
              </div>

              <div className="quick-notes">
                <label>Ghi chú nhanh:</label>
                <div className="quick-note-buttons">
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
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowUpdateModal(false)}
              >
                Hủy
              </button>
              <button
                className="btn-update-confirm"
                onClick={handleUpdateProgress}
                disabled={newPercentage <= 0}
              >
                Cập nhật tiến độ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incident Report Modal */}
      {showIncidentModal && selectedSchedule && (
        <div
          className="modal-overlay"
          onClick={() => setShowIncidentModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header incident-header">
              <h2>⚠️ Báo cáo sự cố</h2>
              <button
                className="modal-close"
                onClick={() => setShowIncidentModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-task-info">
                <p>
                  <strong>Lịch:</strong> SCH-{selectedSchedule.scheduleId}
                </p>
                <p className="task-title-modal">
                  {selectedSchedule.orderInfo || "N/A"}
                </p>
              </div>

              <div className="form-group">
                <label>Loại sự cố</label>
                <select
                  value={newIncident.incidentType}
                  onChange={(e) =>
                    setNewIncident({
                      ...newIncident,
                      incidentType: e.target.value,
                    })
                  }
                  className="form-select"
                >
                  {incidentTypes.map((type) => (
                    <option key={type} value={type}>
                      {incidentTypeLabels[type] || type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Mức độ nghiêm trọng</label>
                <select
                  value={newIncident.severity}
                  onChange={(e) =>
                    setNewIncident({ ...newIncident, severity: e.target.value })
                  }
                  className="form-select"
                >
                  <option value="LOW">Thấp - Không ảnh hưởng nhiều</option>
                  <option value="MEDIUM">
                    Trung bình - Ảnh hưởng năng suất
                  </option>
                  <option value="HIGH">Cao - Phải dừng sản xuất</option>
                </select>
              </div>

              <div className="form-group">
                <label>Mô tả chi tiết *</label>
                <textarea
                  value={newIncident.description}
                  onChange={(e) =>
                    setNewIncident({
                      ...newIncident,
                      description: e.target.value,
                    })
                  }
                  className="form-textarea"
                  placeholder="Mô tả chi tiết sự cố..."
                  rows={4}
                  required
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowIncidentModal(false)}
              >
                Hủy
              </button>
              <button
                className="btn-incident-submit"
                onClick={handleReportIncident}
                disabled={!newIncident.description}
              >
                Gửi báo cáo sự cố
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shift Report Modal */}
      {showReportModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowReportModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Báo cáo cuối ca</h2>
              <button
                className="modal-close"
                onClick={() => setShowReportModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Ca làm việc</label>
                <select
                  value={shiftReport.shift}
                  onChange={(e) =>
                    setShiftReport({ ...shiftReport, shift: e.target.value })
                  }
                  className="form-select"
                >
                  <option value="MORNING">Ca sáng</option>
                  <option value="AFTERNOON">Ca chiều</option>
                  <option value="NIGHT">Ca đêm</option>
                </select>
              </div>

              <div className="form-group">
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
                  className="form-input"
                  placeholder="Nhập sản lượng mục tiêu..."
                />
              </div>

              <div className="form-group">
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
                  className="form-input"
                  placeholder="Nhập sản lượng đạt..."
                />
              </div>

              <div className="form-group">
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
                  className="form-input"
                  placeholder="Nhập sản lượng lỗi..."
                />
              </div>

              <div className="form-group">
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
                  className="form-input"
                  placeholder="Nhập thời gian dừng..."
                />
              </div>

              <div className="form-group">
                <label>Ghi chú</label>
                <textarea
                  value={shiftReport.notes}
                  onChange={(e) =>
                    setShiftReport({ ...shiftReport, notes: e.target.value })
                  }
                  className="form-textarea"
                  placeholder="Ghi chú thêm..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowReportModal(false)}
              >
                Hủy
              </button>
              <button
                className="btn-update-confirm"
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
