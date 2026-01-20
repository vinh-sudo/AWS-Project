import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectUser } from "../../redux";
import { selectAllTasks, updateTaskStatus } from "../../redux";
import imsLogo from "../../assets/ims2.jpg";
import iconPending from "../../assets/wall-clock.png";
import iconInProgress from "../../assets/arrows.png";
import iconCompleted from "../../assets/check.png";
import iconClipboard from "../../assets/clipboard.png";
import "./WorkerTasks.css";

const WorkerTasks = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectUser);
  const allTasks = useSelector(selectAllTasks);

  // Filter tasks for current worker (map status names for display)
  const tasks = allTasks.map((task) => ({
    ...task,
    displayStatus:
      task.status === "Doing"
        ? "In Progress"
        : task.status === "Done"
          ? "Completed"
          : task.status,
  }));

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleStartTask = (taskId) => {
    dispatch(updateTaskStatus({ taskId, status: "Doing" }));
  };

  const handleCompleteTask = (taskId) => {
    dispatch(updateTaskStatus({ taskId, status: "Done" }));
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "In Progress":
      case "Doing":
        return "status-in-progress";
      case "Pending":
        return "status-pending";
      case "Completed":
      case "Done":
        return "status-completed";
      default:
        return "";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "In Progress":
      case "Doing":
        return (
          <img src={iconInProgress} alt="In Progress" className="status-icon" />
        );
      case "Pending":
        return <img src={iconPending} alt="Pending" className="status-icon" />;
      case "Completed":
      case "Done":
        return (
          <img src={iconCompleted} alt="Completed" className="status-icon" />
        );
      default:
        return null;
    }
  };

  return (
    <div className="worker-container">
      {/* Header */}
      <header className="worker-header">
        <div className="header-left">
          <img src={imsLogo} alt="IMS Logo" className="header-logo" />
          <div className="header-title">
            <h1>IMS</h1>
            <span className="header-subtitle">Worker Panel</span>
          </div>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span className="user-name">
              {currentUser?.fullName || "Worker"}
            </span>
            <span className="user-role">Worker</span>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <span>🚪</span> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="worker-main">
        <div className="page-header">
          <h2>
            <img src={iconClipboard} alt="Tasks" className="page-header-icon" />{" "}
            My Tasks
          </h2>
          <p>View and manage your assigned tasks</p>
        </div>

        {/* Task Summary Cards */}
        <div className="task-summary-cards">
          <div className="summary-card pending">
            <div className="summary-icon">
              <img src={iconPending} alt="Pending" />
            </div>
            <div className="summary-content">
              <span className="summary-number">
                {tasks.filter((t) => t.status === "Pending").length}
              </span>
              <span className="summary-text">Pending</span>
            </div>
          </div>
          <div className="summary-card in-progress">
            <div className="summary-icon">
              <img src={iconInProgress} alt="In Progress" />
            </div>
            <div className="summary-content">
              <span className="summary-number">
                {
                  tasks.filter(
                    (t) => t.status === "Doing" || t.status === "In Progress"
                  ).length
                }
              </span>
              <span className="summary-text">In Progress</span>
            </div>
          </div>
          <div className="summary-card completed">
            <div className="summary-icon">
              <img src={iconCompleted} alt="Completed" />
            </div>
            <div className="summary-content">
              <span className="summary-number">
                {
                  tasks.filter(
                    (t) => t.status === "Done" || t.status === "Completed"
                  ).length
                }
              </span>
              <span className="summary-text">Completed</span>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="task-list-card">
          <h3 className="card-title">
            <span>📊</span> Task List
          </h3>
          <div className="table-container">
            <table className="task-table">
              <thead>
                <tr>
                  <th>Task Name</th>
                  <th>Line</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-message">
                      No tasks assigned to you
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.id}>
                      <td className="task-name-cell">{task.taskName}</td>
                      <td>
                        <span className="line-badge">{task.line}</span>
                      </td>
                      <td>
                        <span className="time-cell">🕐 {task.startTime}</span>
                      </td>
                      <td>
                        <span className="time-cell">🕐 {task.endTime}</span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${getStatusClass(task.status)}`}
                        >
                          {getStatusIcon(task.status)} {task.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {task.status === "Pending" && (
                            <button
                              className="btn-start"
                              onClick={() => handleStartTask(task.id)}
                            >
                              ▶ Start Task
                            </button>
                          )}
                          {(task.status === "In Progress" ||
                            task.status === "Doing") && (
                            <button
                              className="btn-complete"
                              onClick={() => handleCompleteTask(task.id)}
                            >
                              ✓ Complete Task
                            </button>
                          )}
                          {(task.status === "Completed" ||
                            task.status === "Done") && (
                            <span className="completed-text">Done</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkerTasks;
