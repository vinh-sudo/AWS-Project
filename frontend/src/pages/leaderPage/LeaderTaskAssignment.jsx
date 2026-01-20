import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import imsLogo from "../../assets/ims2.jpg";
import "./LeaderTaskAssignment.css";

const LeaderTaskAssignment = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  // Form states
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [taskName, setTaskName] = useState("");

  // Mock data for schedules
  const schedules = [
    { id: "SCH-001", name: "SCH-001 - Line A - 08:00-12:00", line: "Line A" },
    { id: "SCH-002", name: "SCH-002 - Line B - 13:00-17:00", line: "Line B" },
    { id: "SCH-003", name: "SCH-003 - Line C - 08:00-12:00", line: "Line C" },
    { id: "SCH-004", name: "SCH-004 - Line A - 13:00-17:00", line: "Line A" },
    { id: "SCH-005", name: "SCH-005 - Line D - 08:00-17:00", line: "Line D" },
  ];

  // Mock data for employees
  const employees = [
    { id: "EMP001", name: "John Smith" },
    { id: "EMP002", name: "Jane Doe" },
    { id: "EMP003", name: "Mike Johnson" },
    { id: "EMP004", name: "Sarah Williams" },
    { id: "EMP005", name: "David Brown" },
  ];

  // Task list state
  const [tasks, setTasks] = useState([
    {
      id: 1,
      taskName: "Machine Operation",
      employeeId: "EMP001",
      employeeName: "John Smith",
      line: "Line A",
      status: "Doing",
    },
    {
      id: 2,
      taskName: "Quality Inspection",
      employeeId: "EMP002",
      employeeName: "Jane Doe",
      line: "Line B",
      status: "Pending",
    },
    {
      id: 3,
      taskName: "Product Packaging",
      employeeId: "EMP003",
      employeeName: "Mike Johnson",
      line: "Line A",
      status: "Done",
    },
  ]);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const getLineName = (scheduleId) => {
    const schedule = schedules.find((s) => s.id === scheduleId);
    return schedule ? schedule.line : "";
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee ? employee.name : "";
  };

  const handleAssign = (e) => {
    e.preventDefault();

    if (!selectedSchedule || !selectedEmployee || !taskName.trim()) {
      alert("Please fill in all required fields!");
      return;
    }

    const newTask = {
      id: tasks.length + 1,
      taskName: taskName.trim(),
      employeeId: selectedEmployee,
      employeeName: getEmployeeName(selectedEmployee),
      line: getLineName(selectedSchedule),
      status: "Pending",
    };

    setTasks([...tasks, newTask]);

    // Reset form
    setSelectedSchedule("");
    setSelectedEmployee("");
    setTaskName("");

    alert("Task assigned successfully!");
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Doing":
        return "status-doing";
      case "Pending":
        return "status-pending";
      case "Done":
        return "status-done";
      default:
        return "";
    }
  };

  const handleUpdateStatus = (taskId, newStatus) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  const handleDeleteTask = (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      setTasks(tasks.filter((task) => task.id !== taskId));
    }
  };

  return (
    <div className="leader-container">
      {/* Header */}
      <header className="leader-header">
        <div className="header-left">
          <img src={imsLogo} alt="IMS Logo" className="header-logo" />
          <div className="header-title">
            <h1>IMS</h1>
            <span className="header-subtitle">Leader Panel</span>
          </div>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span className="user-name">{currentUser?.name || "Leader"}</span>
            <span className="user-role">Leader</span>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <span>🚪</span> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="leader-main">
        <div className="page-header">
          <h2>📋 Task Assignment</h2>
          <p>Assign tasks to employees based on production schedule</p>
        </div>

        <div className="task-content">
          {/* Assignment Form */}
          <div className="assignment-card">
            <h3 className="card-title">
              <span>➕</span> Create New Task
            </h3>
            <form onSubmit={handleAssign} className="assignment-form">
              {/* Schedule Select */}
              <div className="form-group">
                <label className="form-label">Select Schedule</label>
                <div className="select-wrapper">
                  <select
                    className="form-select"
                    value={selectedSchedule}
                    onChange={(e) => setSelectedSchedule(e.target.value)}
                  >
                    <option value="">-- Select production schedule --</option>
                    {schedules.map((schedule) => (
                      <option key={schedule.id} value={schedule.id}>
                        {schedule.name}
                      </option>
                    ))}
                  </select>
                  <span className="select-arrow">▼</span>
                </div>
              </div>

              {/* Employee Select */}
              <div className="form-group">
                <label className="form-label">Select Employee</label>
                <div className="select-wrapper">
                  <select
                    className="form-select"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                  >
                    <option value="">-- Select employee --</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.id} - {employee.name}
                      </option>
                    ))}
                  </select>
                  <span className="select-arrow">▼</span>
                </div>
              </div>

              {/* Task Name Input */}
              <div className="form-group">
                <label className="form-label">Task Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter task name..."
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                />
              </div>

              {/* Assign Button */}
              <div className="form-actions">
                <button type="submit" className="btn-assign">
                  <span>✓</span> Assign
                </button>
              </div>
            </form>
          </div>

          {/* Task List Table */}
          <div className="task-list-card">
            <h3 className="card-title">
              <span>📊</span> Task List
            </h3>
            <div className="table-container">
              <table className="task-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Employee</th>
                    <th>Line</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-message">
                        No tasks have been assigned yet
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => (
                      <tr key={task.id}>
                        <td className="task-name-cell">{task.taskName}</td>
                        <td>
                          <div className="employee-cell">
                            <span className="employee-id">
                              {task.employeeId}
                            </span>
                            <span className="employee-name">
                              {task.employeeName}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="line-badge">{task.line}</span>
                        </td>
                        <td>
                          <select
                            className={`status-select ${getStatusClass(task.status)}`}
                            value={task.status}
                            onChange={(e) =>
                              handleUpdateStatus(task.id, e.target.value)
                            }
                          >
                            <option value="Pending">Pending</option>
                            <option value="Doing">Doing</option>
                            <option value="Done">Done</option>
                          </select>
                        </td>
                        <td>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteTask(task.id)}
                            title="Delete task"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Task Summary */}
            <div className="task-summary">
              <div className="summary-item">
                <span className="summary-label">Total tasks:</span>
                <span className="summary-value">{tasks.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-dot doing"></span>
                <span className="summary-label">Doing:</span>
                <span className="summary-value">
                  {tasks.filter((t) => t.status === "Doing").length}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-dot pending"></span>
                <span className="summary-label">Pending:</span>
                <span className="summary-value">
                  {tasks.filter((t) => t.status === "Pending").length}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-dot done"></span>
                <span className="summary-label">Done:</span>
                <span className="summary-value">
                  {tasks.filter((t) => t.status === "Done").length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LeaderTaskAssignment;
