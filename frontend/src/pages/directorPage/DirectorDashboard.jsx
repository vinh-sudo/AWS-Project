// ============================================================================
// NOTE: Backend chưa có DirectorController hoặc role DIRECTOR.
// Trang này sử dụng 100% dữ liệu mock (hardcoded priorityOrders, kpiSummary, etc).
// Backend chỉ có 4 role: ADMIN, MANAGER, LINE_LEADER, PRODUCTION_PLANNER.
// Director không có trong hệ thống backend hiện tại.
// ============================================================================
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux";
import authService from "../../services/authService";
import imsLogo from "../../assets/ims2.jpg";
import "./DirectorDashboard.css";

const DirectorDashboard = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  // Priority orders that need director attention
  const [priorityOrders, setPriorityOrders] = useState([
    {
      id: "ORD-001",
      customer: "TechCorp Inc.",
      product: "PCB-A100",
      quantity: 5000,
      deadline: "2026-01-27",
      status: "In Progress",
      priority: "High",
      progress: 64,
      directorNote: "",
    },
    {
      id: "ORD-003",
      customer: "MicroTech Co.",
      product: "PCB-C300",
      quantity: 8000,
      deadline: "2026-01-28",
      status: "At Risk",
      priority: "Critical",
      progress: 35,
      directorNote: "Cần tăng ca để kịp deadline",
    },
    {
      id: "ORD-005",
      customer: "VIP Electronics",
      product: "PCB-E500",
      quantity: 10000,
      deadline: "2026-02-05",
      status: "Pending",
      priority: "Medium",
      progress: 0,
      directorNote: "",
    },
  ]);

  // KPI Summary
  const kpiSummary = {
    totalOrders: 25,
    completedOrders: 18,
    onTimeDelivery: 94.5,
    overallOEE: 78.5,
    revenue: "2.5B VND",
    pendingApprovals: 3,
  };

  // Production Lines Overview
  const linesOverview = [
    { name: "SMT Line 1", status: "Running", oee: 85, load: "High" },
    { name: "SMT Line 2", status: "Running", oee: 72, load: "Medium" },
    { name: "Assembly Line 1", status: "Idle", oee: 0, load: "None" },
    { name: "Test Line 1", status: "Running", oee: 60, load: "Low" },
  ];

  // Critical Alerts for Director
  const criticalAlerts = [
    {
      id: 1,
      type: "deadline",
      message: "ORD-003 có nguy cơ trễ deadline 2 ngày",
      severity: "critical",
      time: "30 phút trước",
    },
    {
      id: 2,
      type: "capacity",
      message: "SMT Line 1 đang quá tải (95% capacity)",
      severity: "warning",
      time: "1 giờ trước",
    },
    {
      id: 3,
      type: "approval",
      message: "3 đơn hàng mới cần phê duyệt ưu tiên",
      severity: "info",
      time: "2 giờ trước",
    },
  ];

  const [showDirectiveModal, setShowDirectiveModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [directive, setDirective] = useState("");
  const [newPriority, setNewPriority] = useState("");

  const dispatch = useDispatch();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  const openDirectiveModal = (order) => {
    setSelectedOrder(order);
    setDirective(order.directorNote || "");
    setNewPriority(order.priority);
    setShowDirectiveModal(true);
  };

  const handleSaveDirective = () => {
    setPriorityOrders(
      priorityOrders.map((order) =>
        order.id === selectedOrder.id
          ? { ...order, directorNote: directive, priority: newPriority }
          : order,
      ),
    );
    setShowDirectiveModal(false);
    setSelectedOrder(null);
    alert("Đã lưu chỉ đạo thành công!");
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Running":
      case "Completed":
      case "In Progress":
        return "status-good";
      case "At Risk":
        return "status-risk";
      case "Idle":
      case "Pending":
        return "status-idle";
      default:
        return "";
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "Critical":
        return "priority-critical";
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

  const getAlertClass = (severity) => {
    switch (severity) {
      case "critical":
        return "alert-critical";
      case "warning":
        return "alert-warning";
      case "info":
        return "alert-info";
      default:
        return "";
    }
  };

  return (
    <div className="director-container">
      {/* Sidebar */}
      <aside className="director-sidebar">
        <div className="sidebar-header">
          <img src={imsLogo} alt="IMS Logo" className="sidebar-logo" />
          <span className="sidebar-title">IMS Director</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-item active">
            <span className="nav-icon">📊</span>
            <span>Tổng quan</span>
          </div>
          <div className="nav-item" onClick={() => navigate("/reports")}>
            <span className="nav-icon">📈</span>
            <span>Báo cáo</span>
          </div>
          <div className="nav-item" onClick={() => navigate("/dashboard")}>
            <span className="nav-icon">🏭</span>
            <span>Dashboard chi tiết</span>
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="nav-item logout" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span>Đăng xuất</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="director-main">
        {/* Header */}
        <header className="director-header">
          <div className="header-left">
            <h1>👔 Director Dashboard</h1>
            <p>Tổng quan và ra chỉ đạo sản xuất</p>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">
                {currentUser?.fullName || "Director"}
              </span>
              <span className="user-role">Giám đốc sản xuất</span>
            </div>
          </div>
        </header>

        {/* KPI Summary Cards */}
        <section className="kpi-section">
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon">📦</div>
              <div className="kpi-content">
                <span className="kpi-value">{kpiSummary.totalOrders}</span>
                <span className="kpi-label">Tổng đơn hàng</span>
              </div>
            </div>
            <div className="kpi-card success">
              <div className="kpi-icon">✅</div>
              <div className="kpi-content">
                <span className="kpi-value">{kpiSummary.completedOrders}</span>
                <span className="kpi-label">Hoàn thành</span>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon">⏱️</div>
              <div className="kpi-content">
                <span className="kpi-value">{kpiSummary.onTimeDelivery}%</span>
                <span className="kpi-label">Giao đúng hạn</span>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon">⚡</div>
              <div className="kpi-content">
                <span className="kpi-value">{kpiSummary.overallOEE}%</span>
                <span className="kpi-label">OEE tổng</span>
              </div>
            </div>
            <div className="kpi-card highlight">
              <div className="kpi-icon">💰</div>
              <div className="kpi-content">
                <span className="kpi-value">{kpiSummary.revenue}</span>
                <span className="kpi-label">Doanh thu tháng</span>
              </div>
            </div>
            <div className="kpi-card warning">
              <div className="kpi-icon">⏳</div>
              <div className="kpi-content">
                <span className="kpi-value">{kpiSummary.pendingApprovals}</span>
                <span className="kpi-label">Chờ phê duyệt</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="director-content-grid">
          {/* Priority Orders - Director can set directives */}
          <section className="priority-orders-section">
            <div className="section-header">
              <h2>🎯 Đơn hàng ưu tiên</h2>
              <span className="section-subtitle">
                Ra chỉ đạo và điều chỉnh ưu tiên
              </span>
            </div>
            <div className="orders-table">
              <table>
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Sản phẩm</th>
                    <th>SL</th>
                    <th>Deadline</th>
                    <th>Tiến độ</th>
                    <th>Ưu tiên</th>
                    <th>Chỉ đạo</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {priorityOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="order-id">{order.id}</td>
                      <td>{order.customer}</td>
                      <td>{order.product}</td>
                      <td>{order.quantity.toLocaleString()}</td>
                      <td>{order.deadline}</td>
                      <td>
                        <div className="progress-cell">
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{ width: `${order.progress}%` }}
                            ></div>
                          </div>
                          <span>{order.progress}%</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`priority-badge ${getPriorityClass(order.priority)}`}
                        >
                          {order.priority}
                        </span>
                      </td>
                      <td className="directive-cell">
                        {order.directorNote || (
                          <span className="no-directive">Chưa có</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn-directive"
                          onClick={() => openDirectiveModal(order)}
                        >
                          ✏️ Chỉ đạo
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Lines Overview */}
          <section className="lines-overview-section">
            <div className="section-header">
              <h2>🏭 Tổng quan dây chuyền</h2>
            </div>
            <div className="lines-grid">
              {linesOverview.map((line, index) => (
                <div key={index} className="line-card">
                  <div className="line-header">
                    <span className="line-name">{line.name}</span>
                    <span
                      className={`line-status ${getStatusClass(line.status)}`}
                    >
                      {line.status}
                    </span>
                  </div>
                  <div className="line-metrics">
                    <div className="metric">
                      <span className="metric-label">OEE</span>
                      <span className="metric-value">{line.oee}%</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Tải</span>
                      <span className="metric-value">{line.load}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Critical Alerts */}
          <section className="alerts-section">
            <div className="section-header">
              <h2>🚨 Cảnh báo quan trọng</h2>
            </div>
            <div className="alerts-list">
              {criticalAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`alert-item ${getAlertClass(alert.severity)}`}
                >
                  <div className="alert-icon">
                    {alert.severity === "critical"
                      ? "🔴"
                      : alert.severity === "warning"
                        ? "🟡"
                        : "🔵"}
                  </div>
                  <div className="alert-content">
                    <p className="alert-message">{alert.message}</p>
                    <span className="alert-time">{alert.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Directive Modal */}
      {showDirectiveModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>📝 Ra chỉ đạo cho {selectedOrder.id}</h3>
              <button
                className="modal-close"
                onClick={() => setShowDirectiveModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="order-summary">
                <p>
                  <strong>Khách hàng:</strong> {selectedOrder.customer}
                </p>
                <p>
                  <strong>Sản phẩm:</strong> {selectedOrder.product}
                </p>
                <p>
                  <strong>Deadline:</strong> {selectedOrder.deadline}
                </p>
                <p>
                  <strong>Tiến độ:</strong> {selectedOrder.progress}%
                </p>
              </div>

              <div className="form-group">
                <label>Mức độ ưu tiên:</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                >
                  <option value="Critical">Critical - Khẩn cấp</option>
                  <option value="High">High - Cao</option>
                  <option value="Medium">Medium - Trung bình</option>
                  <option value="Low">Low - Thấp</option>
                </select>
              </div>

              <div className="form-group">
                <label>Chỉ đạo của Giám đốc:</label>
                <textarea
                  value={directive}
                  onChange={(e) => setDirective(e.target.value)}
                  placeholder="Nhập chỉ đạo, ưu tiên, yêu cầu đặc biệt..."
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowDirectiveModal(false)}
              >
                Hủy
              </button>
              <button className="btn-save" onClick={handleSaveDirective}>
                💾 Lưu chỉ đạo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectorDashboard;
