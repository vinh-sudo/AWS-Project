import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import imsLogo from "../../assets/ims2.jpg";
import "./LeaderTaskAssignment.css";

const LeaderTaskAssignment = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("approved");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState("");

  // Mock workers list
  const workers = [
    { id: "WK001", name: "Alex Turner", department: "Assembly" },
    { id: "WK002", name: "Maria Garcia", department: "Quality Control" },
    { id: "WK003", name: "James Wilson", department: "Packaging" },
    { id: "WK004", name: "Emily Chen", department: "Assembly" },
    { id: "WK005", name: "Robert Kim", department: "Testing" },
    { id: "WK006", name: "Sophie Brown", department: "Assembly" },
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
      case "assigned":
        return tasks.filter((t) => t.status === "assigned");
      case "inProgress":
        return tasks.filter((t) => t.status === "in-progress");
      case "completed":
        return tasks.filter((t) => t.status === "completed");
      default:
        return tasks.filter(
          (t) =>
            t.status === "approved" ||
            t.status === "assigned" ||
            t.status === "in-progress" ||
            t.status === "completed",
        );
    }
  };

  const openAssignModal = (task) => {
    setSelectedTask(task);
    setSelectedWorker("");
    setShowAssignModal(true);
  };

  const handleAssignTask = () => {
    if (!selectedWorker) {
      alert("Please select a worker to assign the task!");
      return;
    }

    const worker = workers.find((w) => w.id === selectedWorker);
    const updatedTasks = tasks.map((t) =>
      t.id === selectedTask.id
        ? {
            ...t,
            status: "assigned",
            assignedTo: selectedWorker,
            assignedToName: worker.name,
            assignedBy: "Leader Tom Smith",
            assignedAt: new Date().toISOString(),
          }
        : t,
    );

    saveTasks(updatedTasks);
    setShowAssignModal(false);
    setSelectedTask(null);
    setSelectedWorker("");
    alert("Task assigned successfully!");
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

  const getStatusLabel = (status) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "assigned":
        return "Assigned";
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
  const assignedCount = tasks.filter((t) => t.status === "assigned").length;
  const inProgressCount = tasks.filter(
    (t) => t.status === "in-progress",
  ).length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="leader-assignment-container">
      {/* Sidebar */}
      <aside className="leader-sidebar">
        <div className="sidebar-header">
          <img src={imsLogo} alt="IMS Logo" className="sidebar-logo" />
          <span className="sidebar-title">IMS Leader</span>
        </div>

        <nav className="sidebar-nav">
          <div
            className="nav-item"
            onClick={() => navigate("/leader/progress")}
          >
            <span className="nav-icon">📊</span>
            <span>Progress Update</span>
          </div>
          <div className="nav-item active">
            <span className="nav-icon">📋</span>
            <span>Task Assignment</span>
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
      <main className="leader-main-content">
        {/* Header */}
        <header className="leader-page-header">
          <div className="header-left">
            <h1>📋 Assign Tasks to Workers</h1>
            <p>View approved tasks from Admin and assign to Workers</p>
          </div>
          <div className="header-right">
            <div className="approved-badge">
              <span className="approved-count">{approvedCount}</span>
              <span>Tasks Pending Assignment</span>
            </div>
            <div className="user-info">
              <span className="user-name">Leader Tom Smith</span>
              <span className="user-role">Line Leader</span>
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
            <span className="step-icon active">3</span>
            <span className="step-label">Leader Assigns</span>
          </div>
          <span className="workflow-arrow">→</span>
          <div className="workflow-step">
            <span className="step-icon">4</span>
            <span className="step-label">Worker Executes</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card approved">
            <span className="stat-number">{approvedCount}</span>
            <span className="stat-label">Pending Assignment</span>
          </div>
          <div className="stat-card assigned">
            <span className="stat-number">{assignedCount}</span>
            <span className="stat-label">Assigned</span>
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
            Pending ({approvedCount})
          </button>
          <button
            className={`tab-btn ${activeTab === "assigned" ? "active" : ""}`}
            onClick={() => setActiveTab("assigned")}
          >
            Assigned ({assignedCount})
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

                {/* Assignment Info */}
                {task.assignedTo && (
                  <div className="assignment-info">
                    <span>👷 Worker: {task.assignedToName}</span>
                    <span>📋 Assigned by: {task.assignedBy}</span>
                    <span>
                      📅{" "}
                      {task.assignedAt &&
                        new Date(task.assignedAt).toLocaleString("en-US")}
                    </span>
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
                      className="btn-assign"
                      onClick={() => openAssignModal(task)}
                    >
                      👷 Assign Task
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
              <h2>👷 Assign Task to Worker</h2>
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
                  <strong>Description:</strong> {selectedTask.description}
                </p>
              </div>

              <div className="form-group">
                <label>Select Worker *</label>
                <select
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Select a worker --</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.id} - {worker.name} ({worker.department})
                    </option>
                  ))}
                </select>
              </div>

              {selectedWorker && (
                <div className="selected-worker-info">
                  <h4>Worker Information:</h4>
                  <p>
                    <strong>ID:</strong> {selectedWorker}
                  </p>
                  <p>
                    <strong>Name:</strong>{" "}
                    {workers.find((w) => w.id === selectedWorker)?.name}
                  </p>
                  <p>
                    <strong>Department:</strong>{" "}
                    {workers.find((w) => w.id === selectedWorker)?.department}
                  </p>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-assign-confirm"
                onClick={handleAssignTask}
                disabled={!selectedWorker}
              >
                Assign Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderTaskAssignment;
