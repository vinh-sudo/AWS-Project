import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import imsLogo from "../../assets/ims2.jpg";
import "./LeaderProgress.css";

const LeaderProgress = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("scheduled");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newProgress, setNewProgress] = useState(0);
  const [progressNote, setProgressNote] = useState("");

  // Current leader ID (in real app, this would come from auth)
  const currentLeaderId = "LD001";
  const currentLeaderName = "John Leader";
  const currentTeam = "Team A - Assembly";

  // Load tasks from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem("ims_tasks");
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Save tasks to localStorage when updated
  const saveTasks = (updatedTasks) => {
    localStorage.setItem("ims_tasks", JSON.stringify(updatedTasks));
    setTasks(updatedTasks);
  };

  const handleLogout = () => {
    navigate("/login");
  };

  // Filter tasks assigned to current leader
  const getMyTasks = () => {
    return tasks.filter((t) => t.assignedTo === currentLeaderId);
  };

  // Filter based on active tab
  const getFilteredTasks = () => {
    const myTasks = getMyTasks();
    switch (activeTab) {
      case "scheduled":
        return myTasks.filter((t) => t.status === "scheduled");
      case "inProgress":
        return myTasks.filter((t) => t.status === "in-progress");
      case "completed":
        return myTasks.filter((t) => t.status === "completed");
      default:
        return myTasks;
    }
  };

  const openUpdateModal = (task) => {
    setSelectedTask(task);
    setNewProgress(task.progress || 0);
    setProgressNote("");
    setShowUpdateModal(true);
  };

  const handleUpdateProgress = () => {
    const now = new Date().toISOString();
    const progressHistory = selectedTask.progressHistory || [];

    // Add new progress entry to history
    progressHistory.push({
      progress: newProgress,
      note: progressNote,
      updatedAt: now,
      updatedBy: currentLeaderName,
    });

    // Determine status based on progress
    let newStatus = selectedTask.status;
    if (newProgress > 0 && newProgress < 100) {
      newStatus = "in-progress";
    } else if (newProgress === 100) {
      newStatus = "completed";
    }

    const updatedTasks = tasks.map((t) =>
      t.id === selectedTask.id
        ? {
            ...t,
            progress: newProgress,
            status: newStatus,
            progressHistory: progressHistory,
            lastUpdatedAt: now,
            lastUpdatedBy: currentLeaderName,
            completedAt: newProgress === 100 ? now : t.completedAt,
          }
        : t
    );

    saveTasks(updatedTasks);
    setShowUpdateModal(false);
    setSelectedTask(null);

    if (newProgress === 100) {
      alert("Congratulations! Task completed 100%!");
    } else {
      alert(`Progress updated: ${newProgress}%`);
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "high":
        return "priority-high";
      case "medium":
        return "priority-medium";
      case "low":
        return "priority-low";
      default:
        return "";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "scheduled":
        return "status-scheduled";
      case "in-progress":
        return "status-progress";
      case "completed":
        return "status-completed";
      default:
        return "";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "scheduled":
        return "Scheduled";
      case "in-progress":
        return "In Progress";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return "#4caf50";
    if (progress >= 50) return "#ff9800";
    if (progress >= 20) return "#2196f3";
    return "#9e9e9e";
  };

  const myTasks = getMyTasks();
  const filteredTasks = getFilteredTasks();
  const scheduledCount = myTasks.filter((t) => t.status === "scheduled").length;
  const inProgressCount = myTasks.filter(
    (t) => t.status === "in-progress"
  ).length;
  const completedCount = myTasks.filter((t) => t.status === "completed").length;

  return (
    <div className="leader-progress-container">
      {/* Sidebar */}
      <aside className="leader-sidebar">
        <div className="sidebar-header">
          <img src={imsLogo} alt="IMS Logo" className="sidebar-logo" />
          <span className="sidebar-title">IMS</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item active">
            <span className="nav-icon">📊</span>
            <span>Progress Update</span>
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
            <h1>📊 Progress Update</h1>
            <p>Track and update team task progress</p>
          </div>
          <div className="header-right">
            <div className="task-count-badge">
              <span className="task-count">
                {scheduledCount + inProgressCount}
              </span>
              <span>Tasks in Progress</span>
            </div>
            <div className="user-info">
              <span className="user-name">{currentLeaderName}</span>
              <span className="user-role">Leader - {currentTeam}</span>
            </div>
          </div>
        </header>

        {/* Workflow Info */}
        <div className="workflow-info">
          <div className="workflow-step">
            <span className="step-icon done">1</span>
            <span className="step-label">Manager Creates</span>
          </div>
          <span className="workflow-arrow">→</span>
          <div className="workflow-step">
            <span className="step-icon done">2</span>
            <span className="step-label">Admin Approves</span>
          </div>
          <span className="workflow-arrow">→</span>
          <div className="workflow-step">
            <span className="step-icon done">3</span>
            <span className="step-label">Planner Schedules</span>
          </div>
          <span className="workflow-arrow">→</span>
          <div className="workflow-step">
            <span className="step-icon active">4</span>
            <span className="step-label">Leader Updates</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card scheduled">
            <span className="stat-number">{scheduledCount}</span>
            <span className="stat-label">Scheduled</span>
          </div>
          <div className="stat-card progress">
            <span className="stat-number">{inProgressCount}</span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-card completed">
            <span className="stat-number">{completedCount}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-card total">
            <span className="stat-number">{myTasks.length}</span>
            <span className="stat-label">Total Tasks</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === "scheduled" ? "active" : ""}`}
            onClick={() => setActiveTab("scheduled")}
          >
            Scheduled ({scheduledCount})
          </button>
          <button
            className={`tab-btn ${activeTab === "inProgress" ? "active" : ""}`}
            onClick={() => setActiveTab("inProgress")}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            className={`tab-btn ${activeTab === "completed" ? "active" : ""}`}
            onClick={() => setActiveTab("completed")}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Task Cards */}
        <div className="tasks-list">
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <span>📭</span>
              <p>No tasks found in this list</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task.id} className={`task-card ${task.status}`}>
                <div className="task-header">
                  <div className="task-id-priority">
                    <span className="task-id">{task.id}</span>
                    <span
                      className={`priority-badge ${getPriorityClass(task.priority)}`}
                    >
                      {task.priority === "high"
                        ? "High"
                        : task.priority === "medium"
                          ? "Medium"
                          : "Low"}
                    </span>
                  </div>
                  <span
                    className={`status-badge ${getStatusClass(task.status)}`}
                  >
                    {getStatusLabel(task.status)}
                  </span>
                </div>

                <h3 className="task-title">{task.title}</h3>
                <p className="task-description">{task.description}</p>

                <div className="task-details">
                  <div className="detail-item">
                    <span className="detail-label">Order</span>
                    <span className="detail-value">{task.orderRef}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Production Line</span>
                    <span className="detail-value">{task.productLine}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Quantity</span>
                    <span className="detail-value">{task.quantity} units</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Deadline</span>
                    <span className="detail-value deadline">
                      {task.deadline}
                    </span>
                  </div>
                </div>

                {/* Schedule Info */}
                {task.scheduledStart && (
                  <div className="schedule-info">
                    <span>
                      📅 Schedule: {task.scheduledStart} - {task.scheduledEnd}
                    </span>
                    {task.plannerNotes && (
                      <span>📝 Notes: {task.plannerNotes}</span>
                    )}
                  </div>
                )}

                {/* Progress Section */}
                <div className="progress-section">
                  <div className="progress-header">
                    <span>Current Progress</span>
                    <span
                      className="progress-percentage"
                      style={{ color: getProgressColor(task.progress || 0) }}
                    >
                      {task.progress || 0}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${task.progress || 0}%`,
                        background: getProgressColor(task.progress || 0),
                      }}
                    ></div>
                  </div>
                </div>

                {/* Progress History */}
                {task.progressHistory && task.progressHistory.length > 0 && (
                  <div className="progress-history">
                    <h4>Update History:</h4>
                    <div className="history-list">
                      {task.progressHistory
                        .slice(-3)
                        .reverse()
                        .map((entry, index) => (
                          <div key={index} className="history-item">
                            <span className="history-progress">
                              {entry.progress}%
                            </span>
                            <span className="history-note">
                              {entry.note || "No notes"}
                            </span>
                            <span className="history-time">
                              {new Date(entry.updatedAt).toLocaleString(
                                "en-US"
                              )}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Last Update Info */}
                {task.lastUpdatedAt && (
                  <div className="last-update-info">
                    <span>
                      Last updated:{" "}
                      {new Date(task.lastUpdatedAt).toLocaleString("en-US")}
                    </span>
                  </div>
                )}

                {/* Actions */}
                {task.status !== "completed" && (
                  <div className="task-actions">
                    <button
                      className="btn-update"
                      onClick={() => openUpdateModal(task)}
                    >
                      📊 Update Progress
                    </button>
                  </div>
                )}

                {task.status === "completed" && (
                  <div className="completed-info">
                    <span>
                      ✅ Completed at:{" "}
                      {task.completedAt &&
                        new Date(task.completedAt).toLocaleString("en-US")}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Update Progress Modal */}
      {showUpdateModal && selectedTask && (
        <div
          className="modal-overlay"
          onClick={() => setShowUpdateModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 Update Progress</h2>
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
                  <strong>Task:</strong> {selectedTask.id}
                </p>
                <p className="task-title-modal">{selectedTask.title}</p>
                <p>
                  <strong>Current Progress:</strong>{" "}
                  {selectedTask.progress || 0}%
                </p>
              </div>

              <div className="form-group">
                <label>New Progress (%)</label>
                <div className="progress-input-container">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={newProgress}
                    onChange={(e) => setNewProgress(parseInt(e.target.value))}
                    className="progress-slider"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newProgress}
                    onChange={(e) =>
                      setNewProgress(
                        Math.min(
                          100,
                          Math.max(0, parseInt(e.target.value) || 0)
                        )
                      )
                    }
                    className="progress-number"
                  />
                  <span>%</span>
                </div>
                <div className="progress-preview">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${newProgress}%`,
                        background: getProgressColor(newProgress),
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Detailed Notes</label>
                <textarea
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  className="form-textarea"
                  placeholder="Enter notes about progress, issues encountered, or other details..."
                  rows={4}
                />
              </div>

              <div className="quick-notes">
                <label>Quick Notes:</label>
                <div className="quick-note-buttons">
                  <button
                    onClick={() => setProgressNote("Progressing as planned")}
                  >
                    ✅ On Track
                  </button>
                  <button
                    onClick={() =>
                      setProgressNote(
                        "Encountering minor issues, working to resolve"
                      )
                    }
                  >
                    ⚠️ Minor Issues
                  </button>
                  <button
                    onClick={() =>
                      setProgressNote("Need more time to complete")
                    }
                  >
                    ⏰ Need More Time
                  </button>
                  <button
                    onClick={() =>
                      setProgressNote("Completing ahead of schedule")
                    }
                  >
                    🚀 Ahead of Schedule
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowUpdateModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-update-confirm"
                onClick={handleUpdateProgress}
              >
                Update Progress
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderProgress;
