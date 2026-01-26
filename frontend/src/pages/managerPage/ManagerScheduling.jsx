import React, { useState } from "react";
import authService from "../../services/authService";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import "./ManagerScheduling.css";

const ManagerScheduling = () => {
  const currentUser = authService.getCurrentUser();

  // Form states
  const [selectedOrder, setSelectedOrder] = useState("");
  const [selectedLine, setSelectedLine] = useState("");
  const [startTime, setStartTime] = useState("11:00");
  const [endTime, setEndTime] = useState("13:00");
  const [showConflictWarning, setShowConflictWarning] = useState(false);

  // Mock data for orders
  const orders = [
    { id: "ORD-001", name: "ORD-001 - ABC Corp" },
    { id: "ORD-002", name: "ORD-002 - XYZ Ltd" },
    { id: "ORD-003", name: "ORD-003 - DEF Inc" },
    { id: "ORD-004", name: "ORD-004 - GHI Company" },
    { id: "ORD-005", name: "ORD-005 - JKL Corp" },
  ];

  // Mock data for production lines
  const productionLines = [
    { id: "line-a", name: "Line A" },
    { id: "line-b", name: "Line B" },
    { id: "line-c", name: "Line C" },
    { id: "line-d", name: "Line D" },
    { id: "line-e", name: "Line E" },
  ];

  // Mock existing schedules (for conflict checking)
  const existingSchedules = [
    { line: "line-a", start: "10:00", end: "12:00" },
    { line: "line-b", start: "14:00", end: "16:00" },
  ];

  // Check for schedule conflicts
  const checkConflict = (line, start, end) => {
    if (!line) return false;

    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);

    return existingSchedules.some((schedule) => {
      if (schedule.line !== line) return false;

      const scheduleStart = timeToMinutes(schedule.start);
      const scheduleEnd = timeToMinutes(schedule.end);

      // Check for overlap
      return startMinutes < scheduleEnd && endMinutes > scheduleStart;
    });
  };

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const handleLineChange = (e) => {
    const line = e.target.value;
    setSelectedLine(line);
    setShowConflictWarning(checkConflict(line, startTime, endTime));
  };

  const handleTimeChange = (type, value) => {
    if (type === "start") {
      setStartTime(value);
      setShowConflictWarning(checkConflict(selectedLine, value, endTime));
    } else {
      setEndTime(value);
      setShowConflictWarning(checkConflict(selectedLine, startTime, value));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (showConflictWarning) {
      alert("Cannot schedule - time conflict exists!");
      return;
    }
    console.log("Scheduling:", {
      selectedOrder,
      selectedLine,
      startTime,
      endTime,
    });
    // Add scheduling logic here
  };

  const formatTimeDisplay = (time) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="manager-container">
      {/* Sidebar */}
      <ManagerSidebar />

      {/* Main Content */}
      <div className="manager-main">
        {/* Header */}
        <header className="manager-header">
          <div className="header-left">
            <span className="header-badge">Manager</span>
          </div>
          <div className="header-actions">
            <button className="header-icon-btn">🔔</button>
            <button className="header-icon-btn">⚙️</button>
            <button className="header-icon-btn notification-badge">💬</button>
            <div className="user-menu">
              <div className="user-avatar"></div>
            </div>
          </div>
        </header>

        {/* Page Title */}
        <div className="page-title-section">
          <h1 className="page-title">Scheduling</h1>
        </div>

        {/* Scheduling Content */}
        <div className="manager-content">
          <div className="scheduling-card">
            <form onSubmit={handleSubmit}>
              {/* Select Order */}
              <div className="scheduling-form-group">
                <label className="scheduling-label">Select Order</label>
                <div className="scheduling-select-wrapper">
                  <select
                    className="scheduling-select"
                    value={selectedOrder}
                    onChange={(e) => setSelectedOrder(e.target.value)}
                    required
                  >
                    <option value="">Choose an order...</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.name}
                      </option>
                    ))}
                  </select>
                  <span className="select-arrow">▼</span>
                </div>
              </div>

              {/* Select Production Line */}
              <div className="scheduling-form-group">
                <label className="scheduling-label">
                  Select Production Line
                </label>
                <div className="scheduling-select-wrapper">
                  <select
                    className="scheduling-select"
                    value={selectedLine}
                    onChange={handleLineChange}
                    required
                  >
                    <option value="">Choose a production line...</option>
                    {productionLines.map((line) => (
                      <option key={line.id} value={line.id}>
                        {line.name}
                      </option>
                    ))}
                  </select>
                  <span className="select-arrow">▼</span>
                </div>
              </div>

              {/* Time Range */}
              <div className="scheduling-form-group">
                <label className="scheduling-label">Start Time</label>
                <div className="time-range-container">
                  <div className="time-input-wrapper">
                    <input
                      type="time"
                      className="time-input"
                      value={startTime}
                      onChange={(e) =>
                        handleTimeChange("start", e.target.value)
                      }
                      required
                    />
                    <span className="time-display">
                      {formatTimeDisplay(startTime)}
                    </span>
                    <span className="time-icon">📅</span>
                  </div>
                  <span className="time-separator">~</span>
                  <div className="time-input-wrapper">
                    <input
                      type="time"
                      className="time-input"
                      value={endTime}
                      onChange={(e) => handleTimeChange("end", e.target.value)}
                      required
                    />
                    <span className="time-display">
                      {formatTimeDisplay(endTime)}
                    </span>
                    <span className="time-icon">⏰</span>
                  </div>
                </div>
              </div>

              {/* Conflict Warning */}
              {showConflictWarning && (
                <div className="conflict-warning">
                  <span className="warning-icon">⚠️</span>
                  <span className="warning-text">
                    This line already has a schedule during this time slot.
                  </span>
                </div>
              )}

              {/* Submit Button */}
              <div className="scheduling-actions">
                <button
                  type="submit"
                  className="btn-schedule"
                  disabled={showConflictWarning}
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerScheduling;
