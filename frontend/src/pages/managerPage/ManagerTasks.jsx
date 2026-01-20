import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import imsLogo from "../../assets/ims2.jpg";
import "./ManagerTasks.css";

const ManagerTasks = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Tasks State - stored in localStorage for persistence across pages
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("ims_tasks");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: "TASK-001",
            title: "Assemble PCB Board A100",
            description:
              "Complete assembly of 500 PCB-A100 units for order ORD-001",
            orderRef: "ORD-001",
            productLine: "SMT Line 1",
            quantity: 500,
            priority: "High",
            deadline: "2026-01-25",
            status: "pending", // pending, approved, rejected, assigned, in-progress, completed
            createdBy: "Manager User",
            createdAt: "2026-01-18",
            approvedBy: null,
            approvedAt: null,
            assignedTo: null,
            assignedBy: null,
          },
          {
            id: "TASK-002",
            title: "Quality Check PCB-B200",
            description: "Perform quality inspection on 300 units of PCB-B200",
            orderRef: "ORD-002",
            productLine: "Test Line 1",
            quantity: 300,
            priority: "Medium",
            deadline: "2026-01-22",
            status: "approved",
            createdBy: "Manager User",
            createdAt: "2026-01-17",
            approvedBy: "System Administrator",
            approvedAt: "2026-01-18",
            assignedTo: null,
            assignedBy: null,
          },
          {
            id: "TASK-003",
            title: "SMT Process PCB-C300",
            description: "SMT mounting for 1000 PCB-C300 boards",
            orderRef: "ORD-003",
            productLine: "SMT Line 2",
            quantity: 1000,
            priority: "High",
            deadline: "2026-01-28",
            status: "assigned",
            createdBy: "Manager User",
            createdAt: "2026-01-16",
            approvedBy: "System Administrator",
            approvedAt: "2026-01-17",
            assignedTo: "John Worker",
            assignedBy: "Team Leader",
          },
          {
            id: "TASK-004",
            title: "Package finished products",
            description: "Package and prepare 200 units for shipping",
            orderRef: "ORD-001",
            productLine: "Assembly Line 1",
            quantity: 200,
            priority: "Low",
            deadline: "2026-01-30",
            status: "rejected",
            createdBy: "Manager User",
            createdAt: "2026-01-15",
            approvedBy: null,
            approvedAt: null,
            rejectedReason: "Insufficient resources available",
            assignedTo: null,
            assignedBy: null,
          },
        ];
  });

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    orderRef: "",
    productLine: "SMT Line 1",
    quantity: "",
    priority: "Medium",
    deadline: "",
  });

  // Save tasks to localStorage whenever they change
  const saveTasks = (updatedTasks) => {
    localStorage.setItem("ims_tasks", JSON.stringify(updatedTasks));
    setTasks(updatedTasks);
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    const task = {
      id: `TASK-${String(tasks.length + 1).padStart(3, "0")}`,
      ...newTask,
      quantity: parseInt(newTask.quantity),
      status: "pending",
      createdBy: currentUser?.fullName || "Manager User",
      createdAt: new Date().toISOString().split("T")[0],
      approvedBy: null,
      approvedAt: null,
      assignedTo: null,
      assignedBy: null,
    };
    saveTasks([task, ...tasks]);
    setShowCreateModal(false);
    setNewTask({
      title: "",
      description: "",
      orderRef: "",
      productLine: "SMT Line 1",
      quantity: "",
      priority: "Medium",
      deadline: "",
    });
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

  const filteredTasks =
    activeTab === "all" ? tasks : tasks.filter((t) => t.status === activeTab);

  const taskCounts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    approved: tasks.filter((t) => t.status === "approved").length,
    rejected: tasks.filter((t) => t.status === "rejected").length,
    assigned: tasks.filter((t) => t.status === "assigned").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  return (
    <div className="manager-tasks-container">
      {/* Sidebar */}
      <aside className="manager-sidebar">
        <div className="sidebar-header">
          <img src={imsLogo} alt="IMS Logo" className="sidebar-logo" />
          <span className="sidebar-title">IMS Manager</span>
        </div>
        <nav className="sidebar-nav">
          <div
            className="nav-item"
            onClick={() => navigate("/manager/dashboard")}
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </div>
          <div className="nav-item active">
            <span className="nav-icon">📋</span>
            <span>Task Management</span>
          </div>
          <div className="nav-item" onClick={() => navigate("/manager/orders")}>
            <span className="nav-icon">📦</span>
            <span>Orders</span>
          </div>
          <div
            className="nav-item"
            onClick={() => navigate("/manager/scheduling")}
          >
            <span className="nav-icon">📅</span>
            <span>Scheduling</span>
          </div>
          <div className="nav-item" onClick={() => navigate("/reports")}>
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
      <main className="manager-main">
        {/* Header */}
        <header className="manager-header">
          <div className="header-left">
            <h1>Task Management</h1>
            <p>Create and manage production tasks</p>
          </div>
          <div className="header-right">
            <button
              className="btn-create-task"
              onClick={() => setShowCreateModal(true)}
            >
              + Create New Task
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
            <span className="step-icon active">1</span>
            <span className="step-label">Manager Creates</span>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <span className="step-icon">2</span>
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

        {/* Stats Cards */}
        <div className="stats-row">
          <div className="stat-card pending">
            <span className="stat-number">{taskCounts.pending}</span>
            <span className="stat-label">Pending Approval</span>
          </div>
          <div className="stat-card approved">
            <span className="stat-number">{taskCounts.approved}</span>
            <span className="stat-label">Approved</span>
          </div>
          <div className="stat-card assigned">
            <span className="stat-number">
              {taskCounts.assigned + taskCounts["in-progress"]}
            </span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-card completed">
            <span className="stat-number">{taskCounts.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All ({taskCounts.all})
          </button>
          <button
            className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            Pending ({taskCounts.pending})
          </button>
          <button
            className={`tab-btn ${activeTab === "approved" ? "active" : ""}`}
            onClick={() => setActiveTab("approved")}
          >
            Approved ({taskCounts.approved})
          </button>
          <button
            className={`tab-btn ${activeTab === "rejected" ? "active" : ""}`}
            onClick={() => setActiveTab("rejected")}
          >
            Rejected ({taskCounts.rejected})
          </button>
          <button
            className={`tab-btn ${activeTab === "completed" ? "active" : ""}`}
            onClick={() => setActiveTab("completed")}
          >
            Completed ({taskCounts.completed})
          </button>
        </div>

        {/* Tasks Table */}
        <div className="tasks-table-container">
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Title</th>
                <th>Order Ref</th>
                <th>Production Line</th>
                <th>Quantity</th>
                <th>Priority</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.id}>
                  <td className="task-id">{task.id}</td>
                  <td>
                    <div className="task-title-cell">
                      <span className="task-title">{task.title}</span>
                      <span className="task-desc">{task.description}</span>
                    </div>
                  </td>
                  <td>{task.orderRef}</td>
                  <td>{task.productLine}</td>
                  <td>{task.quantity.toLocaleString()}</td>
                  <td>
                    <span
                      className={`priority-badge ${getPriorityClass(task.priority)}`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td>{task.deadline}</td>
                  <td>
                    <span
                      className={`status-badge ${getStatusClass(task.status)}`}
                    >
                      {task.status.charAt(0).toUpperCase() +
                        task.status.slice(1)}
                    </span>
                  </td>
                  <td>{task.assignedTo || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTasks.length === 0 && (
            <div className="empty-state">
              <span>📋</span>
              <p>No tasks found</p>
            </div>
          )}
        </div>
      </main>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New Task</h2>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="task-form">
              <div className="form-group">
                <label>Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  placeholder="e.g., Assemble PCB Board A100"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  placeholder="Detailed task description..."
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Order Reference</label>
                  <input
                    type="text"
                    value={newTask.orderRef}
                    onChange={(e) =>
                      setNewTask({ ...newTask, orderRef: e.target.value })
                    }
                    placeholder="e.g., ORD-001"
                  />
                </div>
                <div className="form-group">
                  <label>Production Line *</label>
                  <select
                    value={newTask.productLine}
                    onChange={(e) =>
                      setNewTask({ ...newTask, productLine: e.target.value })
                    }
                  >
                    <option value="SMT Line 1">SMT Line 1</option>
                    <option value="SMT Line 2">SMT Line 2</option>
                    <option value="Assembly Line 1">Assembly Line 1</option>
                    <option value="Test Line 1">Test Line 1</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newTask.quantity}
                    onChange={(e) =>
                      setNewTask({ ...newTask, quantity: e.target.value })
                    }
                    placeholder="e.g., 500"
                  />
                </div>
                <div className="form-group">
                  <label>Priority *</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({ ...newTask, priority: e.target.value })
                    }
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Deadline *</label>
                <input
                  type="date"
                  required
                  value={newTask.deadline}
                  onChange={(e) =>
                    setNewTask({ ...newTask, deadline: e.target.value })
                  }
                />
              </div>
              <div className="form-note">
                <span>ℹ️</span>
                <p>
                  After creation, this task will be sent to Admin for approval.
                </p>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerTasks;
