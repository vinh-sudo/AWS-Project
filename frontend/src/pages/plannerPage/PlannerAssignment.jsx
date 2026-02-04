import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import imsLogo from "../../assets/ims2.jpg";
import "./PlannerAssignment.css";

const PlannerAssignment = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("approved");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedLeader, setSelectedLeader] = useState("");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [notes, setNotes] = useState("");

  // Mock leaders list
  const leaders = [
    { id: "LD001", name: "John Leader", team: "Team A - Assembly", members: 8 },
    {
      id: "LD002",
      name: "Mary Smith",
      team: "Team B - Quality Control",
      members: 6,
    },
    {
      id: "LD003",
      name: "David Brown",
      team: "Team C - Packaging",
      members: 5,
    },
    { id: "LD004", name: "Sarah Wilson", team: "Team D - Testing", members: 7 },
    {
      id: "LD005",
      name: "Michael Chen",
      team: "Team E - Assembly",
      members: 9,
    },
  ];

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

  // Filter tasks based on active tab
  const getFilteredTasks = () => {
    switch (activeTab) {
      case "approved":
        return tasks.filter((t) => t.status === "approved");
      case "scheduled":
        return tasks.filter((t) => t.status === "scheduled");
      case "inProgress":
        return tasks.filter((t) => t.status === "in-progress");
      case "completed":
        return tasks.filter((t) => t.status === "completed");
      default:
        return tasks.filter(
          (t) =>
            t.status === "approved" ||
            t.status === "scheduled" ||
            t.status === "in-progress" ||
            t.status === "completed",
        );
    }
  };

  const openAssignModal = (task) => {
    setSelectedTask(task);
    setSelectedLeader("");
    setScheduledStart("");
    setScheduledEnd("");
    setNotes("");
    setShowAssignModal(true);
  };

  const handleAssignTask = () => {
    if (!selectedLeader || !scheduledStart || !scheduledEnd) {
      alert("Please fill in all schedule information and select a Leader!");
      return;
    }

    const leader = leaders.find((l) => l.id === selectedLeader);
    const updatedTasks = tasks.map((t) =>
      t.id === selectedTask.id
        ? {
            ...t,
            status: "scheduled",
            assignedTo: selectedLeader,
            assignedToName: leader.name,
            assignedToTeam: leader.team,
            assignedBy: "Planner Lisa Johnson",
            assignedAt: new Date().toISOString(),
            scheduledStart: scheduledStart,
            scheduledEnd: scheduledEnd,
            plannerNotes: notes,
            progress: 0,
          }
        : t,
    );

    saveTasks(updatedTasks);
    setShowAssignModal(false);
    setSelectedTask(null);
    alert("Task scheduled and assigned to Leader successfully!");
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
      case "approved":
        return "status-approved";
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
      case "approved":
        return "Approved";
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

  const filteredTasks = getFilteredTasks();
  const approvedCount = tasks.filter((t) => t.status === "approved").length;
  const scheduledCount = tasks.filter((t) => t.status === "scheduled").length;
  const inProgressCount = tasks.filter(
    (t) => t.status === "in-progress",
  ).length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="planner-container">
      {/* Sidebar */}
      <aside className="planner-sidebar">
        <div className="sidebar-header">
          <img src={imsLogo} alt="IMS Logo" className="sidebar-logo" />
          <span className="sidebar-title">IMS Planner</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item active">
            <span className="nav-icon">📅</span>
            <span>Assignment</span>
          </div>
          <div
            className="nav-item"
            onClick={() => navigate("/planner/scheduling")}
          >
            <span className="nav-icon">🗓️</span>
            <span>Scheduling</span>
          </div>
          <div
            className="nav-item"
            onClick={() => navigate("/planner/reports")}
          >
            <span className="nav-icon">📈</span>
            <span>Reports</span>
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
      <main className="planner-main">
        {/* Header */}
        <header className="planner-header">
          <div className="header-left">
            <h1>📅 Production Scheduling</h1>
            <p>View approved tasks, set schedule and assign to Leaders</p>
          </div>
          <div className="header-right">
            <div className="approved-badge">
              <span className="approved-count">{approvedCount}</span>
              <span>Tasks Awaiting Schedule</span>
            </div>
            <div className="user-info">
              <span className="user-name">Planner Lisa Johnson</span>
              <span className="user-role">Production Planner</span>
            </div>
          </div>
        </header>

        {/* Workflow Info */}
        <div className="workflow-info">
          <div className="workflow-step">
            <span className="step-icon done">1</span>
            <span className="step-label">Planner Creates</span>
          </div>
          <span className="workflow-arrow">→</span>
          <div className="workflow-step">
            <span className="step-icon done">2</span>
            <span className="step-label">Admin Approves</span>
          </div>
          <span className="workflow-arrow">→</span>
          <div className="workflow-step">
            <span className="step-icon active">3</span>
            <span className="step-label">Planner Schedules</span>
          </div>
          <span className="workflow-arrow">→</span>
          <div className="workflow-step">
            <span className="step-icon">4</span>
            <span className="step-label">Leader Updates</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card approved">
            <span className="stat-number">{approvedCount}</span>
            <span className="stat-label">Awaiting Schedule</span>
          </div>
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
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === "approved" ? "active" : ""}`}
            onClick={() => setActiveTab("approved")}
          >
            Awaiting Schedule ({approvedCount})
          </button>
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
              <div
                key={task.id}
                className={`task-card ${task.status === "approved" ? "approved" : ""}`}
              >
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

                {/* Approval Info */}
                {task.approvedBy && (
                  <div className="approval-info">
                    <span>✅ Approved by: {task.approvedBy}</span>
                    <span>
                      📅{" "}
                      {task.approvedAt &&
                        new Date(task.approvedAt).toLocaleString("en-US")}
                    </span>
                  </div>
                )}

                {/* Schedule Info */}
                {task.scheduledStart && (
                  <div className="schedule-info">
                    <span>
                      📅 Schedule: {task.scheduledStart} - {task.scheduledEnd}
                    </span>
                    <span>
                      👷 Leader: {task.assignedToName} ({task.assignedToTeam})
                    </span>
                  </div>
                )}

                {/* Progress Info */}
                {task.progress !== undefined && task.status !== "approved" && (
                  <div className="progress-section">
                    <div className="progress-header">
                      <span>Progress: {task.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="task-meta">
                  <span>Created by: {task.createdBy}</span>
                  <span>
                    {task.createdAt &&
                      new Date(task.createdAt).toLocaleString("en-US")}
                  </span>
                </div>

                {/* Actions */}
                {task.status === "approved" && (
                  <div className="task-actions">
                    <button
                      className="btn-schedule"
                      onClick={() => openAssignModal(task)}
                    >
                      📅 Schedule & Assign
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Assign Modal */}
      {showAssignModal && selectedTask && (
        <div
          className="modal-overlay"
          onClick={() => setShowAssignModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📅 Schedule & Assign Task</h2>
              <button
                className="modal-close"
                onClick={() => setShowAssignModal(false)}
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
                  <strong>Deadline:</strong> {selectedTask.deadline}
                </p>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={scheduledStart}
                    onChange={(e) => setScheduledStart(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    value={scheduledEnd}
                    onChange={(e) => setScheduledEnd(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Select Leader *</label>
                <select
                  value={selectedLeader}
                  onChange={(e) => setSelectedLeader(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Select a Leader --</option>
                  {leaders.map((leader) => (
                    <option key={leader.id} value={leader.id}>
                      {leader.name} - {leader.team} ({leader.members} members)
                    </option>
                  ))}
                </select>
              </div>

              {selectedLeader && (
                <div className="selected-leader-info">
                  <h4>Leader Information:</h4>
                  <p>
                    <strong>ID:</strong> {selectedLeader}
                  </p>
                  <p>
                    <strong>Name:</strong>{" "}
                    {leaders.find((l) => l.id === selectedLeader)?.name}
                  </p>
                  <p>
                    <strong>Team:</strong>{" "}
                    {leaders.find((l) => l.id === selectedLeader)?.team}
                  </p>
                  <p>
                    <strong>Team Members:</strong>{" "}
                    {leaders.find((l) => l.id === selectedLeader)?.members}{" "}
                    people
                  </p>
                </div>
              )}

              <div className="form-group">
                <label>Notes for Leader</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-textarea"
                  placeholder="Enter notes or instructions for the Leader..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-schedule-confirm"
                onClick={handleAssignTask}
                disabled={!selectedLeader || !scheduledStart || !scheduledEnd}
              >
                Confirm Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlannerAssignment;
