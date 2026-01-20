import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import imsLogo from "../../assets/ims2.jpg";
import "./AdminApproval.css";

const AdminApproval = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [activeTab, setActiveTab] = useState("pending");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // Load tasks from localStorage
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("ims_tasks");
    return saved ? JSON.parse(saved) : [];
  });

  // Reload tasks when component mounts or tab changes
  useEffect(() => {
    const saved = localStorage.getItem("ims_tasks");
    if (saved) {
      setTasks(JSON.parse(saved));
    }
  }, [activeTab]);

  const saveTasks = (updatedTasks) => {
    localStorage.setItem("ims_tasks", JSON.stringify(updatedTasks));
    setTasks(updatedTasks);
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const handleApprove = (taskId) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          status: "approved",
          approvedBy: currentUser?.fullName || "System Administrator",
          approvedAt: new Date().toISOString().split("T")[0],
        };
      }
      return task;
    });
    saveTasks(updatedTasks);
  };

  const handleRejectClick = (task) => {
    setSelectedTask(task);
    setShowRejectModal(true);
  };

  const handleRejectConfirm = () => {
    if (!selectedTask) return;

    const updatedTasks = tasks.map((task) => {
      if (task.id === selectedTask.id) {
        return {
          ...task,
          status: "rejected",
          rejectedBy: currentUser?.fullName || "System Administrator",
          rejectedAt: new Date().toISOString().split("T")[0],
          rejectedReason: rejectReason,
        };
      }
      return task;
    });
    saveTasks(updatedTasks);
    setShowRejectModal(false);
    setSelectedTask(null);
    setRejectReason("");
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "status-pending";
      case "approved":
        return "status-approved";
      case "rejected":
        return "status-rejected";
      case "assigned":
        return "status-assigned";
      case "in-progress":
        return "status-progress";
      case "completed":
        return "status-completed";
      default:
        return "";
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
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

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const approvedTasks = tasks.filter((t) => t.status === "approved");
  const rejectedTasks = tasks.filter((t) => t.status === "rejected");
  const allProcessedTasks = tasks.filter((t) => t.status !== "pending");

  const filteredTasks =
    activeTab === "pending"
      ? pendingTasks
      : activeTab === "approved"
        ? approvedTasks
        : activeTab === "rejected"
          ? rejectedTasks
          : allProcessedTasks;

  return (
    <div className="admin-approval-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <img src={imsLogo} alt="IMS Logo" className="sidebar-logo" />
          <span className="sidebar-title">IMS Admin</span>
        </div>
        <nav className="sidebar-nav">
          <div
            className="nav-item"
            onClick={() => navigate("/admin/dashboard")}
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </div>
          <div className="nav-item active">
            <span className="nav-icon">✅</span>
            <span>Task Approval</span>
          </div>
          <div className="nav-item" onClick={() => navigate("/admin")}>
            <span className="nav-icon">👥</span>
            <span>User Management</span>
          </div>
          <div className="nav-item" onClick={() => navigate("/admin/lines")}>
            <span className="nav-icon">🏭</span>
            <span>Line Management</span>
          </div>
          <div
            className="nav-item"
            onClick={() => navigate("/admin/audit-log")}
          >
            <span className="nav-icon">📝</span>
            <span>Audit Log</span>
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
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="header-left">
            <h1>Task Approval</h1>
            <p>Review and approve tasks created by managers</p>
          </div>
          <div className="header-right">
            <div className="pending-badge">
              <span className="pending-count">{pendingTasks.length}</span>
              <span>Pending Review</span>
            </div>
            <div className="user-info">
              <span className="user-name">
                {currentUser?.fullName || "Admin"}
              </span>
              <span className="user-role">Administrator</span>
            </div>
          </div>
        </header>

        {/* Workflow Info */}
        <div className="workflow-info">
          <div className="workflow-step">
            <span className="step-icon done">✓</span>
            <span className="step-label">Manager Creates</span>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <span className="step-icon active">2</span>
            <span className="step-label">Admin Approves</span>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <span className="step-icon">3</span>
            <span className="step-label">Planner Schedules</span>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <span className="step-icon">4</span>
            <span className="step-label">Leader Updates</span>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card pending">
            <span className="stat-number">{pendingTasks.length}</span>
            <span className="stat-label">Pending Review</span>
          </div>
          <div className="stat-card approved">
            <span className="stat-number">{approvedTasks.length}</span>
            <span className="stat-label">Approved Today</span>
          </div>
          <div className="stat-card rejected">
            <span className="stat-number">{rejectedTasks.length}</span>
            <span className="stat-label">Rejected</span>
          </div>
          <div className="stat-card total">
            <span className="stat-number">{tasks.length}</span>
            <span className="stat-label">Total Tasks</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            🕐 Pending ({pendingTasks.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "approved" ? "active" : ""}`}
            onClick={() => setActiveTab("approved")}
          >
            ✅ Approved ({approvedTasks.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "rejected" ? "active" : ""}`}
            onClick={() => setActiveTab("rejected")}
          >
            ❌ Rejected ({rejectedTasks.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            📋 History ({allProcessedTasks.length})
          </button>
        </div>

        {/* Tasks List */}
        <div className="tasks-list">
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <span>{activeTab === "pending" ? "✅" : "📋"}</span>
              <p>
                {activeTab === "pending"
                  ? "No tasks pending approval"
                  : "No tasks found"}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`task-card ${activeTab === "pending" ? "pending" : ""}`}
              >
                <div className="task-header">
                  <div className="task-id-priority">
                    <span className="task-id">{task.id}</span>
                    <span
                      className={`priority-badge ${getPriorityClass(task.priority)}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <span
                    className={`status-badge ${getStatusClass(task.status)}`}
                  >
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </span>
                </div>

                <h3 className="task-title">{task.title}</h3>
                <p className="task-description">{task.description}</p>

                <div className="task-details">
                  <div className="detail-item">
                    <span className="detail-label">Order Ref:</span>
                    <span className="detail-value">{task.orderRef || "-"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Production Line:</span>
                    <span className="detail-value">{task.productLine}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Quantity:</span>
                    <span className="detail-value">
                      {task.quantity?.toLocaleString()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Deadline:</span>
                    <span className="detail-value deadline">
                      {task.deadline}
                    </span>
                  </div>
                </div>

                <div className="task-meta">
                  <span>
                    Created by: <strong>{task.createdBy}</strong>
                  </span>
                  <span>Created at: {task.createdAt}</span>
                </div>

                {task.status === "rejected" && task.rejectedReason && (
                  <div className="rejection-reason">
                    <span>❌ Rejection Reason:</span> {task.rejectedReason}
                  </div>
                )}

                {task.status === "approved" && (
                  <div className="approval-info">
                    <span>
                      ✅ Approved by: <strong>{task.approvedBy}</strong>
                    </span>
                    <span>on {task.approvedAt}</span>
                  </div>
                )}

                {activeTab === "pending" && (
                  <div className="task-actions">
                    <button
                      className="btn-approve"
                      onClick={() => handleApprove(task.id)}
                    >
                      ✅ Approve
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => handleRejectClick(task)}
                    >
                      ❌ Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Reject Task</h2>
              <button
                className="modal-close"
                onClick={() => setShowRejectModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                You are about to reject task:{" "}
                <strong>{selectedTask?.id}</strong>
              </p>
              <p className="task-title-modal">{selectedTask?.title}</p>
              <div className="form-group">
                <label>Rejection Reason *</label>
                <textarea
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-reject-confirm"
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim()}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApproval;
