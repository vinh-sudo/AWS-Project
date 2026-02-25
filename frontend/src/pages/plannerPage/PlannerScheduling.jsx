import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux";
import authService from "../../services/authService";
import imsLogo from "../../assets/ims2.jpg";
import "./PlannerScheduling.css";

const PlannerScheduling = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  // Production Lines with capacity
  const [productionLines, setProductionLines] = useState([
    {
      id: "LINE-SMT-01",
      name: "SMT Line 1",
      type: "SMT",
      capacity: 500,
      unit: "boards/hour",
      status: "Running",
      utilization: 85,
      currentOrder: "ORD-001",
      machines: ["Pick & Place A1", "Reflow Oven R1", "AOI Inspector"],
    },
    {
      id: "LINE-SMT-02",
      name: "SMT Line 2",
      type: "SMT",
      capacity: 450,
      unit: "boards/hour",
      status: "Running",
      utilization: 72,
      currentOrder: "ORD-003",
      machines: ["Pick & Place A2", "Reflow Oven R2", "AOI Inspector"],
    },
    {
      id: "LINE-ASM-01",
      name: "Assembly Line 1",
      type: "Assembly",
      capacity: 200,
      unit: "units/hour",
      status: "Idle",
      utilization: 0,
      currentOrder: null,
      machines: [
        "Assembly Station 1",
        "Assembly Station 2",
        "Soldering Station",
      ],
    },
    {
      id: "LINE-TST-01",
      name: "Test Line 1",
      type: "Test",
      capacity: 300,
      unit: "units/hour",
      status: "Running",
      utilization: 60,
      currentOrder: "ORD-002",
      machines: ["ICT Tester", "FCT Tester", "Burn-in Chamber"],
    },
  ]);

  // Orders waiting for scheduling
  const [pendingOrders, setPendingOrders] = useState([
    {
      id: "ORD-001",
      customer: "ABC Electronics",
      product: "PCB Board Type A",
      quantity: 5000,
      deadline: "2026-02-15",
      priority: "High",
      requiredLines: ["SMT", "Test"],
      estimatedHours: 10,
    },
    {
      id: "ORD-002",
      customer: "XYZ Technology",
      product: "LED Module V2",
      quantity: 2000,
      deadline: "2026-02-20",
      priority: "Medium",
      requiredLines: ["SMT", "Assembly", "Test"],
      estimatedHours: 15,
    },
    {
      id: "ORD-003",
      customer: "DEF Manufacturing",
      product: "Control Board CB-100",
      quantity: 3000,
      deadline: "2026-01-25",
      priority: "Urgent",
      requiredLines: ["SMT", "Test"],
      estimatedHours: 8,
    },
  ]);

  // Scheduled items (Gantt-like data)
  const [schedules, setSchedules] = useState([
    {
      id: "SCH-001",
      orderId: "ORD-001",
      lineId: "LINE-SMT-01",
      lineName: "SMT Line 1",
      startDate: "2026-01-20",
      startTime: "08:00",
      endDate: "2026-01-20",
      endTime: "18:00",
      status: "In Progress",
      batch: "Batch 1/2",
    },
    {
      id: "SCH-002",
      orderId: "ORD-003",
      lineId: "LINE-SMT-02",
      lineName: "SMT Line 2",
      startDate: "2026-01-20",
      startTime: "08:00",
      endDate: "2026-01-21",
      endTime: "12:00",
      status: "In Progress",
      batch: "Batch 1/1",
    },
    {
      id: "SCH-003",
      orderId: "ORD-002",
      lineId: "LINE-TST-01",
      lineName: "Test Line 1",
      startDate: "2026-01-21",
      startTime: "13:00",
      endDate: "2026-01-22",
      endTime: "17:00",
      status: "Scheduled",
      batch: "Batch 1/1",
    },
  ]);

  // Conflicts & Warnings
  const [conflicts, setConflicts] = useState([
    {
      type: "overload",
      lineId: "LINE-SMT-01",
      message:
        "SMT Line 1 is at 85% capacity. Adding more orders may cause delays.",
      severity: "warning",
    },
    {
      type: "deadline",
      orderId: "ORD-003",
      message:
        "ORD-003 deadline is in 5 days but scheduling shows completion in 6 days.",
      severity: "critical",
    },
  ]);

  const [selectedDate, setSelectedDate] = useState("2026-01-20");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    lineId: "",
    startDate: "",
    startTime: "08:00",
    endTime: "17:00",
  });

  const dispatch = useDispatch();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  const getLineStatusClass = (status) => {
    switch (status) {
      case "Running":
        return "line-running";
      case "Idle":
        return "line-idle";
      case "Maintenance":
        return "line-maintenance";
      default:
        return "";
    }
  };

  const handleScheduleOrder = (order) => {
    setSelectedOrder(order);
    setScheduleForm({
      lineId: "",
      startDate: selectedDate,
      startTime: "08:00",
      endTime: "17:00",
    });
    setShowScheduleModal(true);
  };

  const handleCreateSchedule = (e) => {
    e.preventDefault();
    const line = productionLines.find((l) => l.id === scheduleForm.lineId);
    const newSchedule = {
      id: `SCH-${String(schedules.length + 1).padStart(3, "0")}`,
      orderId: selectedOrder.id,
      lineId: scheduleForm.lineId,
      lineName: line?.name || "",
      startDate: scheduleForm.startDate,
      startTime: scheduleForm.startTime,
      endDate: scheduleForm.startDate,
      endTime: scheduleForm.endTime,
      status: "Scheduled",
      batch: "Batch 1/1",
    };
    setSchedules([...schedules, newSchedule]);
    setShowScheduleModal(false);
    setSelectedOrder(null);
  };

  const timeSlots = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

  return (
    <div className="planner-container">
      {/* Sidebar */}
      <aside className="planner-sidebar">
        <div className="sidebar-header">
          <img src={imsLogo} alt="IMS Logo" className="sidebar-logo" />
          <span className="sidebar-title">IMS Planner</span>
        </div>
        <nav className="sidebar-nav">
          <div
            className="nav-item"
            onClick={() => navigate("/planner/assignment")}
          >
            <span className="nav-icon">📋</span>
            <span>Assignment</span>
          </div>
          <div className="nav-item active">
            <span className="nav-icon">📅</span>
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
            <h1>Production Scheduling</h1>
            <p>Plan and optimize production schedules</p>
          </div>
          <div className="header-right">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-picker"
            />
            <div className="user-info">
              <span className="user-name">
                {currentUser?.fullName || "Planner"}
              </span>
              <span className="user-role">Production Planner</span>
            </div>
          </div>
        </header>

        {/* Alerts Section */}
        {conflicts.length > 0 && (
          <div className="alerts-section">
            <h3>⚠️ Alerts & Warnings</h3>
            <div className="alerts-list">
              {conflicts.map((conflict, index) => (
                <div key={index} className={`alert-item ${conflict.severity}`}>
                  <span className="alert-icon">
                    {conflict.severity === "critical" ? "🔴" : "🟡"}
                  </span>
                  <span className="alert-message">{conflict.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="planner-grid">
          {/* Left Panel - Pending Orders */}
          <div className="pending-orders-panel">
            <h3>📦 Pending Orders</h3>
            <div className="pending-orders-list">
              {pendingOrders.map((order) => (
                <div key={order.id} className="pending-order-card">
                  <div className="order-header">
                    <span className="order-id">{order.id}</span>
                    <span
                      className={`order-priority priority-${order.priority.toLowerCase()}`}
                    >
                      {order.priority}
                    </span>
                  </div>
                  <div className="order-details">
                    <p className="customer">{order.customer}</p>
                    <p className="product">{order.product}</p>
                    <p className="quantity">
                      {order.quantity.toLocaleString()} pcs
                    </p>
                    <p className="deadline">
                      <span>📅</span> {order.deadline}
                    </p>
                    <p className="lines">
                      <span>🏭</span> {order.requiredLines.join(" → ")}
                    </p>
                    <p className="hours">
                      <span>⏱️</span> Est. {order.estimatedHours}h
                    </p>
                  </div>
                  <button
                    className="btn-schedule-order"
                    onClick={() => handleScheduleOrder(order)}
                  >
                    Schedule
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Center Panel - Schedule Board */}
          <div className="schedule-board-panel">
            <h3>📋 Schedule Board - {selectedDate}</h3>
            <div className="schedule-board">
              <div className="schedule-header">
                <div className="line-column">Line</div>
                {timeSlots.map((slot) => (
                  <div key={slot} className="time-column">
                    {slot}
                  </div>
                ))}
              </div>
              <div className="schedule-body">
                {productionLines.map((line) => (
                  <div key={line.id} className="schedule-row">
                    <div className="line-info">
                      <span
                        className={`line-status-dot ${getLineStatusClass(line.status)}`}
                      ></span>
                      <span className="line-name">{line.name}</span>
                    </div>
                    <div className="time-slots">
                      {schedules
                        .filter(
                          (s) =>
                            s.lineId === line.id &&
                            s.startDate === selectedDate,
                        )
                        .map((schedule) => {
                          const startHour = parseInt(
                            schedule.startTime.split(":")[0],
                          );
                          const endHour = parseInt(
                            schedule.endTime.split(":")[0],
                          );
                          const left = (startHour - 8) * 10;
                          const width = (endHour - startHour) * 10;
                          return (
                            <div
                              key={schedule.id}
                              className={`schedule-block ${schedule.status.toLowerCase().replace(" ", "-")}`}
                              style={{
                                left: `${left}%`,
                                width: `${width}%`,
                              }}
                              title={`${schedule.orderId} - ${schedule.batch}`}
                            >
                              <span className="block-order">
                                {schedule.orderId}
                              </span>
                              <span className="block-batch">
                                {schedule.batch}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Line Status */}
          <div className="line-status-panel">
            <h3>🏭 Line Status</h3>
            <div className="line-status-list">
              {productionLines.map((line) => (
                <div key={line.id} className="line-status-card">
                  <div className="line-header">
                    <span className="line-name">{line.name}</span>
                    <span
                      className={`line-status ${getLineStatusClass(line.status)}`}
                    >
                      {line.status}
                    </span>
                  </div>
                  <div className="line-type">{line.type}</div>
                  <div className="line-capacity">
                    Capacity: {line.capacity} {line.unit}
                  </div>
                  <div className="line-utilization">
                    <span>Utilization</span>
                    <div className="utilization-bar">
                      <div
                        className="utilization-fill"
                        style={{
                          width: `${line.utilization}%`,
                          background:
                            line.utilization > 80
                              ? "#f44336"
                              : line.utilization > 50
                                ? "#ff9800"
                                : "#4caf50",
                        }}
                      ></div>
                    </div>
                    <span className="utilization-text">
                      {line.utilization}%
                    </span>
                  </div>
                  {line.currentOrder && (
                    <div className="current-order">
                      Running: <strong>{line.currentOrder}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scheduled Orders Table */}
        <div className="scheduled-orders-section">
          <h3>📊 Scheduled Orders</h3>
          <div className="scheduled-table-container">
            <table className="scheduled-table">
              <thead>
                <tr>
                  <th>Schedule ID</th>
                  <th>Order ID</th>
                  <th>Line</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Batch</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.id}>
                    <td className="schedule-id">{schedule.id}</td>
                    <td className="order-id">{schedule.orderId}</td>
                    <td>{schedule.lineName}</td>
                    <td>
                      {schedule.startDate} {schedule.startTime}
                    </td>
                    <td>
                      {schedule.endDate} {schedule.endTime}
                    </td>
                    <td>{schedule.batch}</td>
                    <td>
                      <span
                        className={`status-badge status-${schedule.status.toLowerCase().replace(" ", "-")}`}
                      >
                        {schedule.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action edit" title="Edit">
                          ✏️
                        </button>
                        <button className="btn-action delete" title="Delete">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Schedule Modal */}
      {showScheduleModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Schedule Order: {selectedOrder.id}</h2>
              <button
                className="modal-close"
                onClick={() => setShowScheduleModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateSchedule} className="schedule-form">
              <div className="order-summary">
                <p>
                  <strong>Customer:</strong> {selectedOrder.customer}
                </p>
                <p>
                  <strong>Product:</strong> {selectedOrder.product}
                </p>
                <p>
                  <strong>Quantity:</strong>{" "}
                  {selectedOrder.quantity.toLocaleString()} pcs
                </p>
                <p>
                  <strong>Deadline:</strong> {selectedOrder.deadline}
                </p>
                <p>
                  <strong>Required Lines:</strong>{" "}
                  {selectedOrder.requiredLines.join(" → ")}
                </p>
              </div>
              <div className="form-group">
                <label>Select Production Line</label>
                <select
                  required
                  value={scheduleForm.lineId}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, lineId: e.target.value })
                  }
                >
                  <option value="">-- Select Line --</option>
                  {productionLines
                    .filter((line) =>
                      selectedOrder.requiredLines.includes(line.type),
                    )
                    .map((line) => (
                      <option key={line.id} value={line.id}>
                        {line.name} ({line.type}) - {line.status}
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.startDate}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.startTime}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        startTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.endTime}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        endTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowScheduleModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlannerScheduling;
