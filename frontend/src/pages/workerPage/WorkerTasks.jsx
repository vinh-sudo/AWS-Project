import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import imsLogo from "../../assets/ims2.jpg";
import "./WorkerTasks.css";

const WorkerTasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("assigned");

  // Current worker ID (in real app, this would come from auth)
  const currentWorkerId = "WK001";
  const currentWorkerName = "Alex Turner";

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

  // Filter tasks assigned to current worker
  const getMyTasks = () => {
    return tasks.filter((t) => t.assignedTo === currentWorkerId);
  };

  // Filter based on active tab
  const getFilteredTasks = () => {
    const myTasks = getMyTasks();
    switch (activeTab) {
      case "assigned":
        return myTasks.filter((t) => t.status === "assigned");
      case "inProgress":
        return myTasks.filter((t) => t.status === "in-progress");
      case "completed":
        return myTasks.filter((t) => t.status === "completed");
      default:
        return myTasks;
    }
  };

  const handleStartTask = (taskId) => {
    const updatedTasks = tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            status: "in-progress",
            startedAt: new Date().toISOString(),
          }
        : t
    );
    saveTasks(updatedTasks);
    alert("Task started!");
  };

  const handleCompleteTask = (taskId) => {
    const updatedTasks = tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            status: "completed",
            completedAt: new Date().toISOString(),
          }
        : t
    );
    saveTasks(updatedTasks);
    alert("Task completed!");
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

  const myTasks = getMyTasks();
  const filteredTasks = getFilteredTasks();
  const assignedCount = myTasks.filter((t) => t.status === "assigned").length;
  const inProgressCount = myTasks.filter(
    (t) => t.status === "in-progress"
  ).length;
  const completedCount = myTasks.filter((t) => t.status === "completed").length;

  return (
    <div className="worker-tasks-container">
      {/* Sidebar */}
      <aside className="worker-sidebar">
        <div className="sidebar-header">
          <img src={imsLogo} alt="IMS Logo" className="sidebar-logo" />
          <span className="sidebar-title">IMS</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item active">
            <span className="nav-icon">📋</span>
            <span>My Tasks</span>
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
      <main className="worker-main-content">
        {/* Header */}
        <header className="worker-page-header">
          <div className="header-left">
            <h1>📋 My Tasks</h1>
            <p>View and work on assigned tasks</p>
          </div>
          <div className="header-right">
            <div className="task-count-badge">
              <span className="task-count">{assignedCount}</span>
              <span>Tasks Pending</span>
            </div>
            <div className="user-info">
              <span className="user-name">{currentWorkerName}</span>
              <span className="user-role">Worker - {currentWorkerId}</span>
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
            <span className="step-label">Leader Assigns</span>
          </div>
          <span className="workflow-arrow">→</span>
          <div className="workflow-step">
            <span className="step-icon active">4</span>
            <span className="step-label">Worker Executes</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card assigned">
            <span className="stat-number">{assignedCount}</span>
            <span className="stat-label">Pending</span>
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
            className={`tab-btn ${activeTab === "assigned" ? "active" : ""}`}
            onClick={() => setActiveTab("assigned")}
          >
            Pending ({assignedCount})
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
                className={`task-card ${task.status === "assigned" ? "assigned" : ""}`}
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

                {/* Assignment Info */}
                {task.assignedBy && (
                  <div className="assignment-info">
                    <span>📋 Assigned by: {task.assignedBy}</span>
                    <span>
                      📅{" "}
                      {task.assignedAt &&
                        new Date(task.assignedAt).toLocaleString("en-US")}
                    </span>
                  </div>
                )}

                {/* Progress Info */}
                {task.startedAt && (
                  <div className="progress-info">
                    <span>
                      ▶ Started:{" "}
                      {new Date(task.startedAt).toLocaleString("en-US")}
                    </span>
                  </div>
                )}

                {/* Completion Info */}
                {task.completedAt && (
                  <div className="completion-info">
                    <span>
                      ✅ Completed:{" "}
                      {new Date(task.completedAt).toLocaleString("en-US")}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="task-actions">
                  {task.status === "assigned" && (
                    <button
                      className="btn-start"
                      onClick={() => handleStartTask(task.id)}
                    >
                      ▶ Start Task
                    </button>
                  )}
                  {task.status === "in-progress" && (
                    <button
                      className="btn-complete"
                      onClick={() => handleCompleteTask(task.id)}
                    >
                      ✅ Complete
                    </button>
                  )}
                  {task.status === "completed" && (
                    <span className="completed-label">✅ Task Completed</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default WorkerTasks;
