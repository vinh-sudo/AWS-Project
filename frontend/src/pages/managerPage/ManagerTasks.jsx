import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import "./ManagerTasks.css";

const ManagerTasks = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [activeTab, setActiveTab] = useState("all");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // Production Schedules - auto-generated from confirmed orders
  // This replaces manual task creation
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
          },
          {
            id: "SCH-002",
            orderId: "ORD-002",
            orderName: "PCB-B200 - ElectroParts Ltd.",
            lineName: "SMT Line 2",
            lineId: "LINE-SMT-02",
            quantity: 3000,
            completedQty: 0,
            scheduledStart: "2026-01-28",
            scheduledEnd: "2026-02-10",
            status: "Scheduled",
            priority: "Medium",
            assignedLeader: "Mary Smith",
            assignedLeaderId: "LD002",
            progress: 0,
            lastUpdate: null,
            notes: "",
          },
          {
            id: "SCH-003",
            orderId: "ORD-003",
            orderName: "PCB-C300 - MicroTech Co.",
            lineName: "Assembly Line 1",
            lineId: "LINE-ASM-01",
            quantity: 8000,
            completedQty: 6800,
            scheduledStart: "2026-01-10",
            scheduledEnd: "2026-01-25",
            status: "In Production",
            priority: "Critical",
            assignedLeader: "David Brown",
            assignedLeaderId: "LD003",
            progress: 85,
            lastUpdate: "2026-01-25 16:00",
            notes: "Sắp hoàn thành, cần kiểm tra chất lượng kỹ",
          },
          {
            id: "SCH-004",
            orderId: "ORD-004",
            orderName: "PCB-D400 - DigiSys Corp.",
            lineName: "Test Line 1",
            lineId: "LINE-TST-01",
            quantity: 2500,
            completedQty: 2500,
            scheduledStart: "2026-01-15",
            scheduledEnd: "2026-01-22",
            status: "Completed",
            priority: "Low",
            assignedLeader: "Sarah Wilson",
            assignedLeaderId: "LD004",
            progress: 100,
            lastUpdate: "2026-01-22 17:00",
            notes: "Hoàn thành đúng hạn",
            completedAt: "2026-01-22",
          },
          {
            id: "SCH-005",
            orderId: "ORD-005",
            orderName: "PCB-E500 - CircuitMax",
            lineName: "SMT Line 1",
            lineId: "LINE-SMT-01",
            quantity: 6000,
            completedQty: 1800,
            scheduledStart: "2026-01-18",
            scheduledEnd: "2026-02-10",
            status: "On Hold",
            priority: "Medium",
            assignedLeader: "John Leader",
            assignedLeaderId: "LD001",
            progress: 30,
            lastUpdate: "2026-01-24 10:00",
            notes: "Tạm dừng do thiếu linh kiện",
            holdReason: "Thiếu linh kiện IC-2024",
          },
        ];
  });

  // Save schedules to localStorage
  const saveSchedules = (updatedSchedules) => {
    localStorage.setItem("ims_schedules", JSON.stringify(updatedSchedules));
    setSchedules(updatedSchedules);
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
      case "Cancelled":
        return "status-cancelled";
      default:
        return "";
    }
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

  const filteredSchedules =
    activeTab === "all"
      ? schedules
      : schedules.filter((s) => s.status === activeTab);

  const scheduleCounts = {
    all: schedules.length,
    Scheduled: schedules.filter((s) => s.status === "Scheduled").length,
    "In Production": schedules.filter((s) => s.status === "In Production")
      .length,
    "On Hold": schedules.filter((s) => s.status === "On Hold").length,
    Completed: schedules.filter((s) => s.status === "Completed").length,
  };

  const handleViewDetail = (schedule) => {
    setSelectedSchedule(schedule);
    setShowDetailModal(true);
  };

  const handleResumeSchedule = (scheduleId) => {
    const updatedSchedules = schedules.map((s) =>
      s.id === scheduleId
        ? {
            ...s,
            status: "In Production",
            holdReason: null,
            lastUpdate: new Date().toISOString().replace("T", " ").slice(0, 16),
          }
        : s,
    );
    saveSchedules(updatedSchedules);
    alert("Lịch sản xuất đã được tiếp tục!");
  };

  const handleHoldSchedule = (scheduleId) => {
    const reason = prompt("Nhập lý do tạm dừng:");
    if (reason) {
      const updatedSchedules = schedules.map((s) =>
        s.id === scheduleId
          ? {
              ...s,
              status: "On Hold",
              holdReason: reason,
              lastUpdate: new Date()
                .toISOString()
                .replace("T", " ")
                .slice(0, 16),
            }
          : s,
      );
      saveSchedules(updatedSchedules);
      alert("Lịch sản xuất đã được tạm dừng!");
    }
  };

  return (
    <div className="manager-tasks-container">
      {/* Sidebar */}
      <ManagerSidebar />

      {/* Main Content */}
      <main className="manager-main">
        {/* Header */}
        <header className="manager-header">
          <div className="header-left">
            <h1>📋 Production Schedule</h1>
            <p>Theo dõi và quản lý lịch sản xuất từ các đơn hàng đã xác nhận</p>
          </div>
          <div className="header-right">
            <button
              className="btn-create-task"
              onClick={() => navigate("/manager/scheduling")}
            >
              + Lập lịch mới
            </button>
            <div className="user-info">
              <span className="user-name">
                {currentUser?.fullName || "Manager"}
              </span>
              <span className="user-role">Manager</span>
            </div>
          </div>
        </header>

        {/* Workflow Info */}
        <div className="workflow-info">
          <div className="workflow-step">
            <span className="step-icon done">✓</span>
            <span className="step-label">Order Confirmed</span>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <span className="step-icon done">✓</span>
            <span className="step-label">Schedule Created</span>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <span className="step-icon active">3</span>
            <span className="step-label">Leader Produces</span>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <span className="step-icon">4</span>
            <span className="step-label">Completion</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-row">
          <div className="stat-card scheduled">
            <span className="stat-number">{scheduleCounts.Scheduled}</span>
            <span className="stat-label">Đã lên lịch</span>
          </div>
          <div className="stat-card production">
            <span className="stat-number">
              {scheduleCounts["In Production"]}
            </span>
            <span className="stat-label">Đang sản xuất</span>
          </div>
          <div className="stat-card hold">
            <span className="stat-number">{scheduleCounts["On Hold"]}</span>
            <span className="stat-label">Tạm dừng</span>
          </div>
          <div className="stat-card completed">
            <span className="stat-number">{scheduleCounts.Completed}</span>
            <span className="stat-label">Hoàn thành</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            Tất cả ({scheduleCounts.all})
          </button>
          <button
            className={`tab-btn ${activeTab === "Scheduled" ? "active" : ""}`}
            onClick={() => setActiveTab("Scheduled")}
          >
            Đã lên lịch ({scheduleCounts.Scheduled})
          </button>
          <button
            className={`tab-btn ${activeTab === "In Production" ? "active" : ""}`}
            onClick={() => setActiveTab("In Production")}
          >
            Đang sản xuất ({scheduleCounts["In Production"]})
          </button>
          <button
            className={`tab-btn ${activeTab === "On Hold" ? "active" : ""}`}
            onClick={() => setActiveTab("On Hold")}
          >
            Tạm dừng ({scheduleCounts["On Hold"]})
          </button>
          <button
            className={`tab-btn ${activeTab === "Completed" ? "active" : ""}`}
            onClick={() => setActiveTab("Completed")}
          >
            Hoàn thành ({scheduleCounts.Completed})
          </button>
        </div>

        {/* Schedules Table */}
        <div className="tasks-table-container">
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Schedule ID</th>
                <th>Đơn hàng</th>
                <th>Line sản xuất</th>
                <th>Số lượng</th>
                <th>Tiến độ</th>
                <th>Thời gian</th>
                <th>Độ ưu tiên</th>
                <th>Trạng thái</th>
                <th>Leader</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map((schedule) => (
                <tr key={schedule.id}>
                  <td className="task-id">{schedule.id}</td>
                  <td>
                    <div className="task-title-cell">
                      <span className="task-title">{schedule.orderId}</span>
                      <span className="task-desc">{schedule.orderName}</span>
                    </div>
                  </td>
                  <td>{schedule.lineName}</td>
                  <td>
                    <div className="quantity-info">
                      <span>{schedule.completedQty.toLocaleString()}</span>
                      <span className="qty-sep">/</span>
                      <span>{schedule.quantity.toLocaleString()}</span>
                    </div>
                  </td>
                  <td>
                    <div className="progress-cell">
                      <div className="progress-bar-mini">
                        <div
                          className="progress-fill-mini"
                          style={{ width: `${schedule.progress}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {schedule.progress}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="date-range">
                      <span>{schedule.scheduledStart}</span>
                      <span className="date-arrow">→</span>
                      <span>{schedule.scheduledEnd}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`priority-badge ${getPriorityClass(schedule.priority)}`}
                    >
                      {schedule.priority}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${getStatusClass(schedule.status)}`}
                    >
                      {schedule.status}
                    </span>
                  </td>
                  <td>{schedule.assignedLeader || "—"}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-action btn-view"
                        onClick={() => handleViewDetail(schedule)}
                        title="Xem chi tiết"
                      >
                        👁️
                      </button>
                      {schedule.status === "In Production" && (
                        <button
                          className="btn-action btn-hold"
                          onClick={() => handleHoldSchedule(schedule.id)}
                          title="Tạm dừng"
                        >
                          ⏸️
                        </button>
                      )}
                      {schedule.status === "On Hold" && (
                        <button
                          className="btn-action btn-resume"
                          onClick={() => handleResumeSchedule(schedule.id)}
                          title="Tiếp tục"
                        >
                          ▶️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSchedules.length === 0 && (
            <div className="empty-state">
              <span>📋</span>
              <p>Không tìm thấy lịch sản xuất</p>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedSchedule && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Chi tiết lịch sản xuất: {selectedSchedule.id}</h2>
              <button
                className="modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Đơn hàng:</label>
                  <span>
                    {selectedSchedule.orderId} - {selectedSchedule.orderName}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Line sản xuất:</label>
                  <span>{selectedSchedule.lineName}</span>
                </div>
                <div className="detail-item">
                  <label>Số lượng:</label>
                  <span>
                    {selectedSchedule.completedQty.toLocaleString()} /{" "}
                    {selectedSchedule.quantity.toLocaleString()} units
                  </span>
                </div>
                <div className="detail-item">
                  <label>Thời gian:</label>
                  <span>
                    {selectedSchedule.scheduledStart} →{" "}
                    {selectedSchedule.scheduledEnd}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Leader phụ trách:</label>
                  <span>{selectedSchedule.assignedLeader}</span>
                </div>
                <div className="detail-item">
                  <label>Trạng thái:</label>
                  <span
                    className={`status-badge ${getStatusClass(selectedSchedule.status)}`}
                  >
                    {selectedSchedule.status}
                  </span>
                </div>
                {selectedSchedule.lastUpdate && (
                  <div className="detail-item">
                    <label>Cập nhật cuối:</label>
                    <span>{selectedSchedule.lastUpdate}</span>
                  </div>
                )}
                {selectedSchedule.holdReason && (
                  <div className="detail-item full-width">
                    <label>Lý do tạm dừng:</label>
                    <span className="hold-reason">
                      {selectedSchedule.holdReason}
                    </span>
                  </div>
                )}
                {selectedSchedule.notes && (
                  <div className="detail-item full-width">
                    <label>Ghi chú:</label>
                    <span>{selectedSchedule.notes}</span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="detail-progress">
                <label>Tiến độ sản xuất:</label>
                <div className="progress-bar-large">
                  <div
                    className="progress-fill-large"
                    style={{ width: `${selectedSchedule.progress}%` }}
                  >
                    <span>{selectedSchedule.progress}%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowDetailModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerTasks;
