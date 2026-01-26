import React, { useState } from "react";
import authService from "../../services/authService";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import "./ManagerOrders.css";

const ManagerOrders = () => {
  const currentUser = authService.getCurrentUser();

  // Filter states
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state for viewing order details
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Orders data - synced with Admin's confirmed orders
  // Status flow: Confirmed → Scheduled → In Production → Completed
  const [orders, setOrders] = useState([
    {
      id: "ORD-001",
      customer: "TechCorp Inc.",
      product: "PCB-A100",
      quantity: 5000,
      completedQty: 3250,
      deadline: "2026-02-15",
      status: "In Production",
      priority: "High",
      assignedLine: "Line A",
      progress: 65,
      createdAt: "2026-01-10",
    },
    {
      id: "ORD-002",
      customer: "ElectroParts Ltd.",
      product: "PCB-B200",
      quantity: 3000,
      completedQty: 0,
      deadline: "2026-01-28",
      status: "Confirmed",
      priority: "Medium",
      assignedLine: null,
      progress: 0,
      createdAt: "2026-01-12",
    },
    {
      id: "ORD-003",
      customer: "MicroTech Co.",
      product: "PCB-C300",
      quantity: 8000,
      completedQty: 6800,
      deadline: "2026-01-25",
      status: "In Production",
      priority: "Critical",
      assignedLine: "Line B",
      progress: 85,
      createdAt: "2026-01-05",
    },
    {
      id: "ORD-004",
      customer: "DigiSys Corp.",
      product: "PCB-D400",
      quantity: 2500,
      completedQty: 0,
      deadline: "2026-02-20",
      status: "Scheduled",
      priority: "Low",
      assignedLine: "Line C",
      progress: 0,
      createdAt: "2026-01-18",
    },
    {
      id: "ORD-005",
      customer: "CircuitMax",
      product: "PCB-E500",
      quantity: 6000,
      completedQty: 1800,
      deadline: "2026-02-10",
      status: "On Hold",
      priority: "Medium",
      assignedLine: "Line A",
      progress: 30,
      createdAt: "2026-01-15",
    },
    {
      id: "ORD-006",
      customer: "GlobalTech",
      product: "PCB-F600",
      quantity: 4000,
      completedQty: 4000,
      deadline: "2026-01-20",
      status: "Completed",
      priority: "High",
      assignedLine: "Line D",
      progress: 100,
      createdAt: "2026-01-08",
    },
    {
      id: "ORD-007",
      customer: "SmartElec",
      product: "PCB-G700",
      quantity: 2000,
      completedQty: 0,
      deadline: "2026-02-25",
      status: "Confirmed",
      priority: "Medium",
      assignedLine: null,
      progress: 0,
      createdAt: "2026-01-22",
    },
  ]);

  const getStatusClass = (status) => {
    switch (status) {
      case "Confirmed":
        return "status-confirmed";
      case "Scheduled":
        return "status-scheduled";
      case "In Production":
        return "status-production";
      case "On Hold":
        return "status-hold";
      case "Completed":
        return "status-completed";
      case "Cancelled":
        return "status-cancelled";
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

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (statusFilter && order.status !== statusFilter) return false;
    if (priorityFilter && order.priority !== priorityFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        order.id.toLowerCase().includes(search) ||
        order.customer.toLowerCase().includes(search) ||
        order.product.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Stats calculation
  const stats = {
    confirmed: orders.filter((o) => o.status === "Confirmed").length,
    scheduled: orders.filter((o) => o.status === "Scheduled").length,
    inProduction: orders.filter((o) => o.status === "In Production").length,
    completed: orders.filter((o) => o.status === "Completed").length,
    onHold: orders.filter((o) => o.status === "On Hold").length,
  };

  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleScheduleOrder = (orderId) => {
    // Navigate to scheduling page with order context
    window.location.href = `/manager/scheduling?orderId=${orderId}`;
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
            <h1 className="page-title">📦 Order Management</h1>
          </div>
          <div className="header-actions">
            <button className="header-icon-btn">🔔</button>
            <div className="user-menu">
              <div className="user-avatar"></div>
              <span className="user-name">
                {currentUser?.fullName || "Manager"}
              </span>
            </div>
          </div>
        </header>

        {/* Orders Content */}
        <div className="manager-content">
          {/* Stats Cards */}
          <div className="order-stats-row">
            <div className="order-stat-card confirmed">
              <span className="stat-number">{stats.confirmed}</span>
              <span className="stat-label">Chờ lập lịch</span>
            </div>
            <div className="order-stat-card scheduled">
              <span className="stat-number">{stats.scheduled}</span>
              <span className="stat-label">Đã lên lịch</span>
            </div>
            <div className="order-stat-card production">
              <span className="stat-number">{stats.inProduction}</span>
              <span className="stat-label">Đang sản xuất</span>
            </div>
            <div className="order-stat-card hold">
              <span className="stat-number">{stats.onHold}</span>
              <span className="stat-label">Tạm dừng</span>
            </div>
            <div className="order-stat-card completed">
              <span className="stat-number">{stats.completed}</span>
              <span className="stat-label">Hoàn thành</span>
            </div>
          </div>

          {/* Filters */}
          <div className="filter-section">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm đơn hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-controls">
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Confirmed">Chờ lập lịch</option>
                <option value="Scheduled">Đã lên lịch</option>
                <option value="In Production">Đang sản xuất</option>
                <option value="On Hold">Tạm dừng</option>
                <option value="Completed">Hoàn thành</option>
              </select>

              <select
                className="filter-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">Tất cả độ ưu tiên</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Khách hàng</th>
                  <th>Sản phẩm</th>
                  <th>Số lượng</th>
                  <th>Tiến độ</th>
                  <th>Deadline</th>
                  <th>Độ ưu tiên</th>
                  <th>Trạng thái</th>
                  <th>Line</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="order-id-cell">{order.id}</td>
                    <td>{order.customer}</td>
                    <td>{order.product}</td>
                    <td>
                      <div className="quantity-cell">
                        <span>{order.completedQty.toLocaleString()}</span>
                        <span className="qty-separator">/</span>
                        <span>{order.quantity.toLocaleString()}</span>
                      </div>
                    </td>
                    <td>
                      <div className="progress-cell">
                        <div className="progress-bar-mini">
                          <div
                            className="progress-fill-mini"
                            style={{ width: `${order.progress}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">{order.progress}%</span>
                      </div>
                    </td>
                    <td>{order.deadline}</td>
                    <td>
                      <span
                        className={`priority-badge ${getPriorityClass(order.priority)}`}
                      >
                        {order.priority}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`order-status-badge ${getStatusClass(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td>{order.assignedLine || "—"}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-view"
                          onClick={() => handleViewDetail(order)}
                          title="Xem chi tiết"
                        >
                          👁️
                        </button>
                        {order.status === "Confirmed" && (
                          <button
                            className="btn-action btn-schedule"
                            onClick={() => handleScheduleOrder(order.id)}
                            title="Lập lịch sản xuất"
                          >
                            📅
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div
          className="modal-overlay"
          onClick={() => setShowDetailModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết đơn hàng: {selectedOrder.id}</h2>
              <button
                className="modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Khách hàng:</label>
                  <span>{selectedOrder.customer}</span>
                </div>
                <div className="detail-item">
                  <label>Sản phẩm:</label>
                  <span>{selectedOrder.product}</span>
                </div>
                <div className="detail-item">
                  <label>Số lượng:</label>
                  <span>{selectedOrder.quantity.toLocaleString()} units</span>
                </div>
                <div className="detail-item">
                  <label>Đã hoàn thành:</label>
                  <span>
                    {selectedOrder.completedQty.toLocaleString()} units (
                    {selectedOrder.progress}%)
                  </span>
                </div>
                <div className="detail-item">
                  <label>Deadline:</label>
                  <span>{selectedOrder.deadline}</span>
                </div>
                <div className="detail-item">
                  <label>Độ ưu tiên:</label>
                  <span
                    className={`priority-badge ${getPriorityClass(selectedOrder.priority)}`}
                  >
                    {selectedOrder.priority}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Trạng thái:</label>
                  <span
                    className={`order-status-badge ${getStatusClass(selectedOrder.status)}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Line sản xuất:</label>
                  <span>{selectedOrder.assignedLine || "Chưa phân bổ"}</span>
                </div>
                <div className="detail-item">
                  <label>Ngày tạo:</label>
                  <span>{selectedOrder.createdAt}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="detail-progress">
                <label>Tiến độ tổng thể:</label>
                <div className="progress-bar-large">
                  <div
                    className="progress-fill-large"
                    style={{ width: `${selectedOrder.progress}%` }}
                  >
                    <span>{selectedOrder.progress}%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {selectedOrder.status === "Confirmed" && (
                <button
                  className="btn-primary"
                  onClick={() => {
                    setShowDetailModal(false);
                    handleScheduleOrder(selectedOrder.id);
                  }}
                >
                  📅 Lập lịch sản xuất
                </button>
              )}
              <button
                className="btn-cancel"
                onClick={() => setShowDetailModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerOrders;
