import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import AdminSidebar from "../../components/AdminSidebar/AdminSidebar";
import authService from "../../services/authService";
import adminService from "../../services/adminService";
import "./AdminApproval.css";

const AdminApproval = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [activeTab, setActiveTab] = useState("draft");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // Orders from real backend API
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch orders from backend on mount and tab change
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getAllOrders();
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const dispatch = useDispatch();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  // Confirm order (DRAFT → CONFIRMED) via real backend API
  const handleConfirmOrder = async (orderId) => {
    try {
      setActionLoading(true);
      await adminService.confirmOrder(orderId);
      await fetchOrders(); // Refresh from backend
      alert("Đơn hàng đã được xác nhận và chuyển sang Planner để lập lịch!");
    } catch (err) {
      console.error("Error confirming order:", err);
      alert(err.response?.data?.message || "Failed to confirm order");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = (order) => {
    setSelectedOrder(order);
    setShowRejectModal(true);
  };

  // Cancel/reject order via real backend API
  // NOTE: Backend uses "cancel" (status CANCELLED), not "reject"
  const handleRejectConfirm = async () => {
    if (!selectedOrder) return;

    try {
      setActionLoading(true);
      await adminService.cancelOrder(selectedOrder.id, rejectReason);
      setShowRejectModal(false);
      setSelectedOrder(null);
      setRejectReason("");
      await fetchOrders(); // Refresh from backend
      alert("Đơn hàng đã bị từ chối (hủy)!");
    } catch (err) {
      console.error("Error cancelling order:", err);
      alert(err.response?.data?.message || "Failed to cancel order");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Draft":
        return "status-draft";
      case "Confirmed":
        return "status-confirmed";
      case "Cancelled":
        return "status-rejected";
      case "In Production":
        return "status-production";
      case "Completed":
        return "status-completed";
      default:
        return "";
    }
  };

  // Backend already returns display-friendly status strings
  const getStatusDisplay = (status) => status || "Unknown";

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

  // Filter using backend status values (Title Case)
  const draftOrders = orders.filter((o) => o.status === "Draft");
  const confirmedOrders = orders.filter((o) => o.status === "Confirmed");
  const cancelledOrders = orders.filter((o) => o.status === "Cancelled");
  const allProcessedOrders = orders.filter((o) => o.status !== "Draft");

  const filteredOrders =
    activeTab === "draft"
      ? draftOrders
      : activeTab === "confirmed"
        ? confirmedOrders
        : activeTab === "rejected"
          ? cancelledOrders
          : allProcessedOrders;

  return (
    <div className="admin-approval-container">
      <AdminSidebar />

      {/* Main Content */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="header-left">
            <h1>📋 Order Approval</h1>
            <p>
              Xác nhận đơn hàng mới từ Sales để chuyển sang lập lịch sản xuất
            </p>
          </div>
          <div className="header-right">
            <div className="pending-badge">
              <span className="pending-count">{draftOrders.length}</span>
              <span>Chờ xác nhận</span>
            </div>
            <NotificationBell />
            <div className="user-info">
              <span className="user-name">
                {currentUser?.fullName || "Admin"}
              </span>
              <span className="user-role">Administrator</span>
            </div>
          </div>
        </header>

        {/* Workflow Info */}
        <div className="workflow-info">
          <div className="workflow-step">
            <span className="step-icon done">✓</span>
            <span className="step-label">Sales tạo đơn</span>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <span className="step-icon active">2</span>
            <span className="step-label">Admin xác nhận</span>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <span className="step-icon">3</span>
            <span className="step-label">Planner lập lịch</span>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <span className="step-icon">4</span>
            <span className="step-label">Leader sản xuất</span>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card pending">
            <span className="stat-number">{draftOrders.length}</span>
            <span className="stat-label">Chờ xác nhận</span>
          </div>
          <div className="stat-card approved">
            <span className="stat-number">{confirmedOrders.length}</span>
            <span className="stat-label">Đã xác nhận</span>
          </div>
          <div className="stat-card rejected">
            <span className="stat-number">{cancelledOrders.length}</span>
            <span className="stat-label">Đã từ chối</span>
          </div>
          <div className="stat-card total">
            <span className="stat-number">{orders.length}</span>
            <span className="stat-label">Tổng đơn hàng</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === "draft" ? "active" : ""}`}
            onClick={() => setActiveTab("draft")}
          >
            🕐 Chờ xác nhận ({draftOrders.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "confirmed" ? "active" : ""}`}
            onClick={() => setActiveTab("confirmed")}
          >
            ✅ Đã xác nhận ({confirmedOrders.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "rejected" ? "active" : ""}`}
            onClick={() => setActiveTab("rejected")}
          >
            ❌ Đã hủy ({cancelledOrders.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            📋 Lịch sử ({allProcessedOrders.length})
          </button>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="empty-state">
            <span>⏳</span>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <span>⚠️</span>
            <p>{error}</p>
            <button className="btn-approve" onClick={fetchOrders}>
              Thử lại
            </button>
          </div>
        ) : (
          <div className="tasks-list">
            {filteredOrders.length === 0 ? (
              <div className="empty-state">
                <span>{activeTab === "draft" ? "✅" : "📋"}</span>
                <p>
                  {activeTab === "draft"
                    ? "Không có đơn hàng nào chờ xác nhận"
                    : "Không tìm thấy đơn hàng"}
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className={`task-card ${activeTab === "draft" ? "pending" : ""}`}
                >
                  <div className="task-header">
                    <div className="task-id-priority">
                      <span className="task-id">#{order.id}</span>
                      <span
                        className={`priority-badge ${getPriorityClass(order.priority)}`}
                      >
                        {order.priority}
                      </span>
                    </div>
                    <span
                      className={`status-badge ${getStatusClass(order.status)}`}
                    >
                      {getStatusDisplay(order.status)}
                    </span>
                  </div>

                  <h3 className="task-title">{order.customerName}</h3>
                  <p className="task-description">
                    Sản phẩm: {order.productType}
                  </p>

                  <div className="task-details">
                    <div className="detail-item">
                      <span className="detail-label">Số lượng:</span>
                      <span className="detail-value">
                        {order.quantity?.toLocaleString()} units
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Deadline:</span>
                      <span className="detail-value deadline">
                        {order.deadline
                          ? new Date(order.deadline).toLocaleDateString("vi-VN")
                          : "N/A"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Ngày tạo:</span>
                      <span className="detail-value">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString(
                              "vi-VN",
                            )
                          : "N/A"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Người tạo:</span>
                      <span className="detail-value">
                        {order.createdByName || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Show order items if any */}
                  {order.items && order.items.length > 0 && (
                    <div className="order-notes">
                      <span>📦 Chi tiết:</span>{" "}
                      {order.items
                        .map((item) => `${item.productName} x${item.quantity}`)
                        .join(", ")}
                    </div>
                  )}

                  {order.status === "Cancelled" && (
                    <div className="rejection-reason">
                      <span>❌ Đơn hàng đã bị hủy</span>
                    </div>
                  )}

                  {order.status === "Confirmed" && (
                    <div className="approval-info">
                      <span>✅ Đã xác nhận</span>
                      <span>
                        {order.updatedAt
                          ? new Date(order.updatedAt).toLocaleDateString(
                              "vi-VN",
                            )
                          : ""}
                      </span>
                    </div>
                  )}

                  {activeTab === "draft" && (
                    <div className="task-actions">
                      <button
                        className="btn-approve"
                        onClick={() => handleConfirmOrder(order.id)}
                        disabled={actionLoading}
                      >
                        {actionLoading
                          ? "⏳ Đang xử lý..."
                          : "✅ Xác nhận đơn hàng"}
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => handleRejectClick(order)}
                        disabled={actionLoading}
                      >
                        ❌ Từ chối
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Từ chối đơn hàng</h2>
              <button
                className="modal-close"
                onClick={() => setShowRejectModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Bạn đang từ chối đơn hàng: <strong>{selectedOrder?.id}</strong>
              </p>
              <p className="task-title-modal">
                Khách hàng: {selectedOrder?.customerName}
                <br />
                Sản phẩm: {selectedOrder?.productType}
                <br />
                Số lượng: {selectedOrder?.quantity?.toLocaleString()} units
              </p>
              <div className="form-group">
                <label>Lý do từ chối *</label>
                <textarea
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Vui lòng nhập lý do từ chối đơn hàng..."
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowRejectModal(false)}
              >
                Hủy
              </button>
              <button
                className="btn-reject-confirm"
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim() || actionLoading}
              >
                {actionLoading ? "⏳ Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApproval;
