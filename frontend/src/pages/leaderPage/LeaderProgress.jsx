import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import imsLogo from "../../assets/ims2.jpg";
import "./LeaderProgress.css";

const LeaderProgress = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("inProgress");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [saelectedSchedule, setSelectedSchedule] = useState(null);
  const [newOutput, setNewOutput] = useState(0);
  const [progressNote, setProgressNote] = useState("");

  // Current leader info
  const currentLeaderId = "LD001";
  const currentLeaderName = "John Leader";
  const currentTeam = "SMT Line 1";

  // Load production schedules assigned to this leader
  const [schedules, setSchedules] = useState(() => {
    const saved = localStorage.getItem("ims_schedules");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: "SCH-001",
            orderId: "ORD-001",
            orderName: "PCB-A100 - TechCorp Inc.",
            lineName: "SMT Line 1",
            lineId: "LINE-SMT-01",
            quantity: 5000,
            completedQty: 3250,
            scheduledStart: "2026-01-20",
            scheduledEnd: "2026-02-15",
            status: "In Production",
            priority: "High",
            assignedLeader: "John Leader",
            assignedLeaderId: "LD001",
            progress: 65,
            lastUpdate: "2026-01-25 14:30",
            notes: "Đang chạy đúng tiến độ",
            outputHistory: [
              { date: "2026-01-20", qty: 1000, note: "Day 1 - Good start" },
              {
                date: "2026-01-21",
                qty: 1200,
                note: "Day 2 - Smooth production",
              },
              {
                date: "2026-01-22",
                qty: 1050,
                note: "Day 3 - Minor adjustments",
              },
            ],
            incidents: [],
          },
          {
            id: "SCH-003",
            orderId: "ORD-003",
            orderName: "PCB-C300 - MicroTech Co.",
            lineName: "SMT Line 1",
            lineId: "LINE-SMT-01",
            quantity: 8000,
            completedQty: 6800,
            scheduledStart: "2026-01-10",
            scheduledEnd: "2026-01-25",
            status: "In Production",
            priority: "Critical",
            assignedLeader: "John Leader",
            assignedLeaderId: "LD001",
            progress: 85,
            lastUpdate: "2026-01-25 16:00",
            notes: "Sắp hoàn thành",
            outputHistory: [],
            incidents: [],
          },
        ];
  });

  // Incident types
  const incidentTypes = [
    "Máy hỏng",
    "Thiếu nguyên liệu",
    "Chất lượng kém",
    "An toàn lao động",
    "Thiếu nhân công",
    "Khác",
  ];

  const [newIncident, setNewIncident] = useState({
    type: "Máy hỏng",
    description: "",
    severity: "Medium",
    affectedQty: 0,
  });

  // Get schedules for current leader
  const getMySchedules = () => {
    return schedules.filter((s) => s.assignedLeaderId === currentLeaderId);
  };

  // Filter based on active tab
  const getFilteredSchedules = () => {
    const mySchedules = getMySchedules();
    switch (activeTab) {
      case "scheduled":
        return mySchedules.filter((s) => s.status === "Scheduled");
      case "inProgress":
        return mySchedules.filter((s) => s.status === "In Production");
      case "completed":
        return mySchedules.filter((s) => s.status === "Completed");
      case "onHold":
        return mySchedules.filter((s) => s.status === "On Hold");
      default:
        return mySchedules;
    }
  };

  // Save schedules to localStorage
  const saveSchedules = (updatedSchedules) => {
    localStorage.setItem("ims_schedules", JSON.stringify(updatedSchedules));
    setSchedules(updatedSchedules);
  };

  const handleLogout = () => {
    navigate("/login");
  };

  const openUpdateModal = (schedule) => {
    setSelectedSchedule(schedule);
    setNewOutput(0);
    setProgressNote("");
    setShowUpdateModal(true);
  };

  const openIncidentModal = (schedule) => {
    setSelectedSchedule(schedule);
    setNewIncident({
      type: "Máy hỏng",
      description: "",
      severity: "Medium",
      affectedQty: 0,
    });
    setShowIncidentModal(true);
  };

  const handleUpdateOutput = () => {
    const now = new Date().toISOString();
    const today = now.split("T")[0];

    const outputHistory = selectedSchedule.outputHistory || [];
    outputHistory.push({
      date: today,
      qty: newOutput,
      note: progressNote,
      updatedAt: now,
      updatedBy: currentLeaderName,
    });

    const newCompletedQty = selectedSchedule.completedQty + newOutput;
    const newProgress = Math.min(
      100,
      Math.round((newCompletedQty / selectedSchedule.quantity) * 100),
    );

    // Auto-complete if 100%
    const newStatus =
      newProgress >= 100 ? "Completed" : selectedSchedule.status;

    const updatedSchedules = schedules.map((s) =>
      s.id === selectedSchedule.id
        ? {
            ...s,
            completedQty: Math.min(newCompletedQty, s.quantity),
            progress: newProgress,
            status: newStatus,
            outputHistory: outputHistory,
            lastUpdate: now.replace("T", " ").slice(0, 16),
            completedAt: newProgress >= 100 ? today : s.completedAt,
          }
        : s,
    );

    saveSchedules(updatedSchedules);
    setShowUpdateModal(false);
    setSelectedSchedule(null);

    if (newProgress >= 100) {
      alert("🎉 Hoàn thành sản xuất! Đã đạt 100%");
    } else {
      alert(
        `✅ Đã cập nhật: +${newOutput} sản phẩm. Tổng: ${newCompletedQty}/${selectedSchedule.quantity}`,
      );
    }
  };

  const handleReportIncident = () => {
    const now = new Date().toISOString();

    const incidents = selectedSchedule.incidents || [];
    incidents.push({
      id: `INC-${Date.now()}`,
      ...newIncident,
      reportedAt: now,
      reportedBy: currentLeaderName,
      status: "Open",
    });

    const updatedSchedules = schedules.map((s) =>
      s.id === selectedSchedule.id
        ? {
            ...s,
            incidents: incidents,
            lastUpdate: now.replace("T", " ").slice(0, 16),
          }
        : s,
    );

    saveSchedules(updatedSchedules);
    setShowIncidentModal(false);
    setSelectedSchedule(null);
    alert("⚠️ Đã báo cáo sự cố. Manager sẽ được thông báo.");
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "Critical":
        return "priority-critical";
      case "High":
        return "priority-high";
      case "Medium":
        return "priority-medium";
      case "Low":
        return "priority-low";
      default:
        return "";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Scheduled":
        return "status-scheduled";
      case "In Production":
        return "status-production";
      case "Completed":
        return "status-completed";
      case "On Hold":
        return "status-hold";
      default:
        return "";
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return "#4caf50";
    if (progress >= 50) return "#ff9800";
    if (progress >= 20) return "#2196f3";
    return "#9e9e9e";
  };

  const mySchedules = getMySchedules();
  const filteredSchedules = getFilteredSchedules();
  const scheduledCount = mySchedules.filter(
    (s) => s.status === "Scheduled",
  ).length;
  const inProgressCount = mySchedules.filter(
    (s) => s.status === "In Production",
  ).length;
  const completedCount = mySchedules.filter(
    (s) => s.status === "Completed",
  ).length;
  const onHoldCount = mySchedules.filter((s) => s.status === "On Hold").length;
  const totalIncidents = mySchedules.reduce(
    (sum, s) =>
      sum + (s.incidents?.filter((i) => i.status === "Open").length || 0),
    0,
  );

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
            <p>Báo cáo sản lượng và sự cố cho từng lịch sản xuất</p>
          </div>
          <div className="header-right">
            {totalIncidents > 0 && (
              <div className="incident-badge">
                <span className="incident-count">{totalIncidents}</span>
                <span>Sự cố đang mở</span>
              </div>
            )}
            <div className="user-info">
              <span className="user-name">{currentLeaderName}</span>
              <span className="user-role">Leader - {currentTeam}</span>
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
        <div className="stats-row">
          <div className="stat-card scheduled">
            <span className="stat-number">{scheduledCount}</span>
            <span className="stat-label">Chờ sản xuất</span>
          </div>
          <div className="stat-card progress">
            <span className="stat-number">{inProgressCount}</span>
            <span className="stat-label">Đang sản xuất</span>
          </div>
          <div className="stat-card hold">
            <span className="stat-number">{onHoldCount}</span>
            <span className="stat-label">Tạm dừng</span>
          </div>
          <div className="stat-card completed">
            <span className="stat-number">{completedCount}</span>
            <span className="stat-label">Hoàn thành</span>
          </div>
        </div>

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
        <div className="tasks-list">
          {filteredSchedules.length === 0 ? (
            <div className="empty-state">
              <span>📭</span>
              <p>Không có lịch sản xuất nào</p>
            </div>
          ) : (
            filteredSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`task-card ${schedule.status.replace(" ", "-").toLowerCase()}`}
              >
                <div className="task-header">
                  <div className="task-id-priority">
                    <span className="task-id">{schedule.id}</span>
                    <span
                      className={`priority-badge ${getPriorityClass(schedule.priority)}`}
                    >
                      {schedule.priority}
                    </span>
                    {schedule.incidents?.filter((i) => i.status === "Open")
                      .length > 0 && (
                      <span className="incident-flag">⚠️ Có sự cố</span>
                    )}
                  </div>
                  <span
                    className={`status-badge ${getStatusClass(schedule.status)}`}
                  >
                    {schedule.status}
                  </span>
                </div>

                <h3 className="task-title">
                  {schedule.orderId} - {schedule.orderName}
                </h3>

                <div className="task-details">
                  <div className="detail-item">
                    <span className="detail-label">Line sản xuất</span>
                    <span className="detail-value">{schedule.lineName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Thời gian</span>
                    <span className="detail-value">
                      {schedule.scheduledStart} → {schedule.scheduledEnd}
                    </span>
                  </div>
                </div>

                {/* Quantity Progress - MAIN FEATURE */}
                <div className="quantity-section">
                  <div className="quantity-header">
                    <span className="quantity-label">
                      Sản lượng hoàn thành:
                    </span>
                    <span className="quantity-value">
                      <strong>{schedule.completedQty.toLocaleString()}</strong>
                      <span className="qty-sep">/</span>
                      {schedule.quantity.toLocaleString()} units
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${schedule.progress}%`,
                        background: getProgressColor(schedule.progress),
                      }}
                    ></div>
                  </div>
                  <div className="progress-info">
                    <span
                      className="progress-percentage"
                      style={{ color: getProgressColor(schedule.progress) }}
                    >
                      {schedule.progress}%
                    </span>
                    <span className="remaining">
                      Còn lại:{" "}
                      {(
                        schedule.quantity - schedule.completedQty
                      ).toLocaleString()}{" "}
                      units
                    </span>
                  </div>
                </div>

                {/* Output History */}
                {schedule.outputHistory &&
                  schedule.outputHistory.length > 0 && (
                    <div className="output-history">
                      <h4>📈 Lịch sử sản lượng gần đây:</h4>
                      <div className="history-list">
                        {schedule.outputHistory
                          .slice(-3)
                          .reverse()
                          .map((entry, index) => (
                            <div key={index} className="history-item">
                              <span className="history-date">{entry.date}</span>
                              <span className="history-qty">
                                +{entry.qty.toLocaleString()}
                              </span>
                              <span className="history-note">
                                {entry.note || "—"}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                {/* Incidents */}
                {schedule.incidents && schedule.incidents.length > 0 && (
                  <div className="incidents-section">
                    <h4>⚠️ Sự cố:</h4>
                    <div className="incidents-list">
                      {schedule.incidents.slice(-2).map((incident) => (
                        <div
                          key={incident.id}
                          className={`incident-item ${incident.severity.toLowerCase()}`}
                        >
                          <span className="incident-type">{incident.type}</span>
                          <span className="incident-desc">
                            {incident.description}
                          </span>
                          <span
                            className={`incident-status ${incident.status.toLowerCase()}`}
                          >
                            {incident.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Last Update */}
                {schedule.lastUpdate && (
                  <div className="last-update-info">
                    <span>Cập nhật lần cuối: {schedule.lastUpdate}</span>
                  </div>
                )}

                {/* Actions */}
                {schedule.status === "In Production" && (
                  <div className="task-actions">
                    <button
                      className="btn-update"
                      onClick={() => openUpdateModal(schedule)}
                    >
                      📊 Cập nhật sản lượng
                    </button>
                    <button
                      className="btn-incident"
                      onClick={() => openIncidentModal(schedule)}
                    >
                      ⚠️ Báo cáo sự cố
                    </button>
                  </div>
                )}

                {schedule.status === "Scheduled" && (
                  <div className="task-actions">
                    <button
                      className="btn-start"
                      onClick={() => {
                        const updatedSchedules = schedules.map((s) =>
                          s.id === schedule.id
                            ? {
                                ...s,
                                status: "In Production",
                                lastUpdate: new Date()
                                  .toISOString()
                                  .replace("T", " ")
                                  .slice(0, 16),
                              }
                            : s,
                        );
                        saveSchedules(updatedSchedules);
                        alert("✅ Đã bắt đầu sản xuất!");
                      }}
                    >
                      ▶️ Bắt đầu sản xuất
                    </button>
                  </div>
                )}

                {schedule.status === "Completed" && (
                  <div className="completed-info">
                    <span>✅ Hoàn thành: {schedule.completedAt}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Update Output Modal */}
      {showUpdateModal && selectedSchedule && (
        <div
          className="modal-overlay"
          onClick={() => setShowUpdateModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 Cập nhật sản lượng</h2>
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
                  <strong>Lịch:</strong> {selectedSchedule.id}
                </p>
                <p className="task-title-modal">
                  {selectedSchedule.orderId} - {selectedSchedule.orderName}
                </p>
                <p>
                  <strong>Hiện tại:</strong>{" "}
                  {selectedSchedule.completedQty.toLocaleString()} /{" "}
                  {selectedSchedule.quantity.toLocaleString()}(
                  {selectedSchedule.progress}%)
                </p>
              </div>

              <div className="form-group">
                <label>Số lượng sản xuất được hôm nay (units)</label>
                <input
                  type="number"
                  min="0"
                  max={
                    selectedSchedule.quantity - selectedSchedule.completedQty
                  }
                  value={newOutput}
                  onChange={(e) => setNewOutput(parseInt(e.target.value) || 0)}
                  className="form-input"
                  placeholder="Nhập số lượng..."
                />
                <div className="output-preview">
                  <span>Sau khi cập nhật: </span>
                  <strong>
                    {(
                      selectedSchedule.completedQty + newOutput
                    ).toLocaleString()}{" "}
                    / {selectedSchedule.quantity.toLocaleString()}
                  </strong>
                  <span>
                    {" "}
                    (
                    {Math.min(
                      100,
                      Math.round(
                        ((selectedSchedule.completedQty + newOutput) /
                          selectedSchedule.quantity) *
                          100,
                      ),
                    )}
                    %)
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>Ghi chú</label>
                <textarea
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  className="form-textarea"
                  placeholder="Nhập ghi chú về ca sản xuất..."
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
                onClick={handleUpdateOutput}
                disabled={newOutput <= 0}
              >
                Cập nhật sản lượng
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
                  <strong>Lịch:</strong> {selectedSchedule.id}
                </p>
                <p className="task-title-modal">
                  {selectedSchedule.orderId} - {selectedSchedule.orderName}
                </p>
              </div>

              <div className="form-group">
                <label>Loại sự cố</label>
                <select
                  value={newIncident.type}
                  onChange={(e) =>
                    setNewIncident({ ...newIncident, type: e.target.value })
                  }
                  className="form-select"
                >
                  {incidentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
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
                  <option value="Low">Thấp - Không ảnh hưởng nhiều</option>
                  <option value="Medium">
                    Trung bình - Ảnh hưởng năng suất
                  </option>
                  <option value="High">Cao - Phải dừng sản xuất</option>
                  <option value="Critical">
                    Nghiêm trọng - Cần xử lý ngay
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label>Số lượng bị ảnh hưởng (nếu có)</label>
                <input
                  type="number"
                  min="0"
                  value={newIncident.affectedQty}
                  onChange={(e) =>
                    setNewIncident({
                      ...newIncident,
                      affectedQty: parseInt(e.target.value) || 0,
                    })
                  }
                  className="form-input"
                  placeholder="0"
                />
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
    </div>
  );
};

export default LeaderProgress;
