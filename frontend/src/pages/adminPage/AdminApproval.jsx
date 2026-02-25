import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux";
import authService from "../../services/authService";
import imsLogo from "../../assets/ims2.jpg";
import dashboardIcon from "../../assets/dashboard.jpg";
import userIcon from "../../assets/user.jpg";
import auditIcon from "../../assets/auditlog.jpg";
import "./AdminApproval.css";

const AdminApproval = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [activeTab, setActiveTab] = useState("draft");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // Load orders from localStorage
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem("ims_orders");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: "ORD-001",
            customerName: "TechCorp Inc.",
            productName: "PCB-A100",
            quantity: 5000,
            deadline: "2026-02-15",
            priority: "High",
            status: "Draft",
            createdAt: "2026-01-20",
            createdBy: "Sales User",
            notes: "Đơn hàng quan trọng, cần ưu tiên xử lý",
          },
          {
            id: "ORD-002",
            customerName: "ElectroParts Ltd.",
            productName: "PCB-B200",
            quantity: 3000,
            deadline: "2026-01-28",
            priority: "Medium",
            status: "Draft",
            createdAt: "2026-01-22",
            createdBy: "Sales User",
            notes: "",
          },
          {
            id: "ORD-003",
            customerName: "MicroTech Co.",
            productName: "PCB-C300",
            quantity: 8000,
            deadline: "2026-02-25",
            priority: "Critical",
            status: "Confirmed",
            createdAt: "2026-01-15",
            createdBy: "Admin",
            confirmedAt: "2026-01-16",
            confirmedBy: "System Administrator",
          },
          {
            id: "ORD-004",
            customerName: "DigiSys Corp.",
            productName: "PCB-D400",
            quantity: 2500,
            deadline: "2026-02-20",
            priority: "Low",
            status: "Rejected",
            createdAt: "2026-01-18",
            createdBy: "Sales User",
            rejectedAt: "2026-01-19",
            rejectedBy: "System Administrator",
            rejectedReason: "Không đủ nguyên liệu trong kho",
          },
          {
            id: "ORD-005",
            customerName: "GlobalTech",
            productName: "PCB-E500",
            quantity: 4000,
            deadline: "2026-02-10",
            priority: "High",
            status: "Draft",
            createdAt: "2026-01-24",
            createdBy: "Sales User",
            notes: "Khách hàng VIP",
          },
        ];
  });

  // Reload orders when component mounts
  useEffect(() => {
    const saved = localStorage.getItem("ims_orders");
    if (saved) {
      setOrders(JSON.parse(saved));
    }
  }, [activeTab]);

  const saveOrders = (updatedOrders) => {
    localStorage.setItem("ims_orders", JSON.stringify(updatedOrders));
    setOrders(updatedOrders);
  };

  const dispatch = useDispatch();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  // Confirm order (Draft → Confirmed)
  const handleConfirmOrder = (orderId) => {
    const updatedOrders = orders.map((order) => {
      if (order.id === orderId) {
        return {
          ...order,
          status: "Confirmed",
          confirmedBy: currentUser?.fullName || "System Administrator",
          confirmedAt: new Date().toISOString().split("T")[0],
        };
      }
      return order;
    });
    saveOrders(updatedOrders);
    alert(
      "Đơn hàng đã được xác nhận và chuyển sang Planner để lập lịch!",
    );
  };

  const handleRejectClick = (order) => {
    setSelectedOrder(order);
    setShowRejectModal(true);
  };

  const handleRejectConfirm = () => {
    if (!selectedOrder) return;

    const updatedOrders = orders.map((order) => {
      if (order.id === selectedOrder.id) {
        return {
          ...order,
          status: "Rejected",
          rejectedBy: currentUser?.fullName || "System Administrator",
          rejectedAt: new Date().toISOString().split("T")[0],
          rejectedReason: rejectReason,
        };
      }
      return order;
    });
    saveOrders(updatedOrders);
    setShowRejectModal(false);
    setSelectedOrder(null);
    setRejectReason("");
    alert("Đơn hàng đã bị từ chối!");
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Draft":
        return "status-draft";
      case "Confirmed":
        return "status-confirmed";
      case "Rejected":
        return "status-rejected";
      case "Scheduled":
        return "status-scheduled";
      case "In Production":
        return "status-production";
      case "Completed":
        return "status-completed";
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

  const draftOrders = orders.filter((o) => o.status === "Draft");
  const confirmedOrders = orders.filter((o) => o.status === "Confirmed");
  const rejectedOrders = orders.filter((o) => o.status === "Rejected");
  const allProcessedOrders = orders.filter((o) => o.status !== "Draft");

  const filteredOrders =
    activeTab === "draft"
      ? draftOrders
      : activeTab === "confirmed"
        ? confirmedOrders
        : activeTab === "rejected"
          ? rejectedOrders
          : allProcessedOrders;

  return (
    <div className="admin-approval-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <img src={imsLogo} alt="IMS Logo" className="sidebar-logo" />
          <span className="sidebar-title">IMS ADMIN</span>
        </div>
        <nav className="sidebar-nav">
          <div
            className="nav-item"
            onClick={() => navigate("/admin/dashboard")}
          >
            <img src={dashboardIcon} alt="Dashboard" className="nav-icon-img" />
            <span>Dashboard</span>
          </div>
          <div className="nav-item active">
            <span className="nav-icon">✅</span>
            <span>Order Approval</span>
          </div>
          <div className="nav-item" onClick={() => navigate("/admin/orders")}>
            <span className="nav-icon">📦</span>
            <span>Order Management</span>
          </div>
          <div className="nav-item" onClick={() => navigate("/admin")}>
            <img src={userIcon} alt="Users" className="nav-icon-img" />
            <span>User Management</span>
          </div>
          <div
            className="nav-item"
            onClick={() => navigate("/admin/audit-log")}
          >
            <img src={auditIcon} alt="Audit Log" className="nav-icon-img" />
            <span>Audit Log</span>
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
            <span className="stat-number">{rejectedOrders.length}</span>
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
            ❌ Đã từ chối ({rejectedOrders.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            📋 Lịch sử ({allProcessedOrders.length})
          </button>
        </div>

        {/* Orders List */}
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
                    <span className="task-id">{order.id}</span>
                    <span
                      className={`priority-badge ${getPriorityClass(order.priority)}`}
                    >
                      {order.priority}
                    </span>
                  </div>
                  <span
                    className={`status-badge ${getStatusClass(order.status)}`}
                  >
                    {order.status}
                  </span>
                </div>

                <h3 className="task-title">{order.customerName}</h3>
                <p className="task-description">
                  Sản phẩm: {order.productName}
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
                      {order.deadline}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ngày tạo:</span>
                    <span className="detail-value">{order.createdAt}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Người tạo:</span>
                    <span className="detail-value">{order.createdBy}</span>
                  </div>
                </div>

                {order.notes && (
                  <div className="order-notes">
                    <span>📝 Ghi chú:</span> {order.notes}
                  </div>
                )}

                {order.status === "Rejected" && order.rejectedReason && (
                  <div className="rejection-reason">
                    <span>❌ Lý do từ chối:</span> {order.rejectedReason}
                    <div className="rejection-meta">
                      Từ chối bởi: <strong>{order.rejectedBy}</strong> vào{" "}
                      {order.rejectedAt}
                    </div>
                  </div>
                )}

                {order.status === "Confirmed" && (
                  <div className="approval-info">
                    <span>
                      ✅ Xác nhận bởi: <strong>{order.confirmedBy}</strong>
                    </span>
                    <span>vào {order.confirmedAt}</span>
                  </div>
                )}

                {activeTab === "draft" && (
                  <div className="task-actions">
                    <button
                      className="btn-approve"
                      onClick={() => handleConfirmOrder(order.id)}
                    >
                      ✅ Xác nhận đơn hàng
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => handleRejectClick(order)}
                    >
                      ❌ Từ chối
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
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
                Sản phẩm: {selectedOrder?.productName}
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
                disabled={!rejectReason.trim()}
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApproval;
