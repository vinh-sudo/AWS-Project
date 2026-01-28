import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import imsLogo from "../../assets/ims2.jpg";
import dashboardIcon from "../../assets/dashboard.jpg";
import userIcon from "../../assets/user.jpg";
import auditIcon from "../../assets/auditlog.jpg";
import "./adminUser.css";

const AdminOrders = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  // Orders state
  const [orders, setOrders] = useState([
    {
      id: "ORD-001",
      customerName: "TechCorp Inc.",
      productName: "PCB-A100",
      quantity: 5000,
      deadline: "2026-02-15",
      priority: "High",
      status: "In Production",
      progress: 65,
      createdAt: "2026-01-10",
      createdBy: "Sales User",
    },
    {
      id: "ORD-002",
      customerName: "ElectroParts Ltd.",
      productName: "PCB-B200",
      quantity: 3000,
      deadline: "2026-01-28",
      priority: "Medium",
      status: "Confirmed",
      progress: 0,
      createdAt: "2026-01-12",
      createdBy: "Sales User",
    },
    {
      id: "ORD-003",
      customerName: "MicroTech Co.",
      productName: "PCB-C300",
      quantity: 8000,
      deadline: "2026-01-25",
      priority: "Critical",
      status: "In Production",
      progress: 85,
      createdAt: "2026-01-05",
      createdBy: "Admin",
    },
    {
      id: "ORD-004",
      customerName: "DigiSys Corp.",
      productName: "PCB-D400",
      quantity: 2500,
      deadline: "2026-02-20",
      priority: "Low",
      status: "Draft",
      progress: 0,
      createdAt: "2026-01-18",
      createdBy: "Sales User",
    },
    {
      id: "ORD-005",
      customerName: "CircuitMax",
      productName: "PCB-E500",
      quantity: 6000,
      deadline: "2026-02-10",
      priority: "Medium",
      status: "On Hold",
      progress: 30,
      createdAt: "2026-01-15",
      createdBy: "Admin",
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ type: "", orderId: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  const [formData, setFormData] = useState({
    customerName: "",
    productName: "",
    quantity: "",
    deadline: "",
    priority: "Medium",
    notes: "",
  });

  const [editingOrder, setEditingOrder] = useState(null);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  // Create new order
  const handleCreateOrder = () => {
    const newOrder = {
      id: `ORD-${String(orders.length + 1).padStart(3, "0")}`,
      ...formData,
      quantity: parseInt(formData.quantity),
      status: "Draft",
      progress: 0,
      createdAt: new Date().toISOString().split("T")[0],
      createdBy: currentUser?.fullName || "Admin",
    };
    setOrders([newOrder, ...orders]);
    setShowCreateModal(false);
    resetForm();
    alert("Đơn hàng đã được tạo thành công!");
  };

  // Confirm order (Draft -> Confirmed)
  const handleConfirmOrder = (orderId) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: "Confirmed",
              confirmedAt: new Date().toISOString().split("T")[0],
              confirmedBy: currentUser?.fullName || "Admin",
            }
          : order
      )
    );
    alert("Đơn hàng đã được xác nhận!");
  };

  // Cancel order
  const handleCancelOrder = (orderId) => {
    setConfirmAction({ type: "cancel", orderId });
    setShowConfirmModal(true);
  };

  // Hold/Pause order
  const handleHoldOrder = (orderId) => {
    setConfirmAction({ type: "hold", orderId });
    setShowConfirmModal(true);
  };

  // Resume order (On Hold -> In Production)
  const handleResumeOrder = (orderId) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: "In Production",
              resumedAt: new Date().toISOString().split("T")[0],
            }
          : order
      )
    );
    alert("Đơn hàng đã được tiếp tục!");
  };

  // Delete order
  const handleDeleteOrder = (orderId) => {
    setConfirmAction({ type: "delete", orderId });
    setShowConfirmModal(true);
  };

  // Execute confirm action
  const executeConfirmAction = () => {
    const { type, orderId } = confirmAction;
    
    if (type === "cancel") {
      setOrders(
        orders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: "Cancelled",
                cancelledAt: new Date().toISOString().split("T")[0],
                cancelledBy: currentUser?.fullName || "Admin",
              }
            : order
        )
      );
      alert("Đơn hàng đã bị hủy!");
    } else if (type === "hold") {
      setOrders(
        orders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: "On Hold",
                holdAt: new Date().toISOString().split("T")[0],
              }
            : order
        )
      );
      alert("Đơn hàng đã được tạm dừng!");
    } else if (type === "delete") {
      setOrders(orders.filter((order) => order.id !== orderId));
      alert("Đơn hàng đã bị xóa!");
    }
    
    setShowConfirmModal(false);
    setConfirmAction({ type: "", orderId: "" });
  };

  // Edit order
  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setFormData({
      customerName: order.customerName,
      productName: order.productName,
      quantity: order.quantity.toString(),
      deadline: order.deadline,
      priority: order.priority,
      notes: order.notes || "",
    });
    setShowEditModal(true);
  };

  // Save edited order
  const handleSaveEdit = () => {
    setOrders(
      orders.map((order) =>
        order.id === editingOrder.id
          ? {
              ...order,
              ...formData,
              quantity: parseInt(formData.quantity),
              updatedAt: new Date().toISOString().split("T")[0],
              updatedBy: currentUser?.fullName || "Admin",
            }
          : order
      )
    );
    setShowEditModal(false);
    setEditingOrder(null);
    resetForm();
    alert("Đơn hàng đã được cập nhật!");
  };

  const resetForm = () => {
    setFormData({
      customerName: "",
      productName: "",
      quantity: "",
      deadline: "",
      priority: "Medium",
      notes: "",
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Draft":
        return "status-draft";
      case "Confirmed":
        return "status-confirmed";
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
    const matchSearch =
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "All" || order.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const stats = {
    total: orders.length,
    draft: orders.filter((o) => o.status === "Draft").length,
    confirmed: orders.filter((o) => o.status === "Confirmed").length,
    inProduction: orders.filter((o) => o.status === "In Production").length,
    onHold: orders.filter((o) => o.status === "On Hold").length,
    completed: orders.filter((o) => o.status === "Completed").length,
    cancelled: orders.filter((o) => o.status === "Cancelled").length,
  };

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <img src={imsLogo} alt="Logo" className="sidebar-logo" />
          <div className="sidebar-title">IMS Admin</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item" onClick={() => navigate("/admin/dashboard")}>
            <img src={dashboardIcon} alt="Dashboard" className="nav-icon-img" />
            <span>Dashboard</span>
          </div>
          <div className="nav-item" onClick={() => navigate("/admin/approval")}>
            <span className="nav-icon">✅</span>
            <span>Task Approval</span>
          </div>
          <div className="nav-item active">
            <span className="nav-icon">📦</span>
            <span>Order Management</span>
          </div>          <div className="nav-item" onClick={() => navigate("/admin")}>
            <img src={userIcon} alt="Users" className="nav-icon-img" />
            <span>User Management</span>
          </div>
          <div className="nav-item" onClick={() => navigate("/admin/audit-log")}>
            <img src={auditIcon} alt="Audit Log" className="nav-icon-img" />
            <span>Audit Log</span>
          </div>
        </nav>

        <div className="logout-item">
          <div className="nav-item logout" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span>Logout</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        <header className="admin-header">
          <h1 className="header-title">📦 Order Management</h1>
          <div className="header-actions">
            <button className="header-icon-btn">🔔</button>
            <div className="user-menu">
              <div className="user-avatar"></div>
              <span className="user-name">{currentUser?.fullName || "Admin"}</span>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {/* Stats Cards */}
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total Orders</span>
            </div>
            <div className="stat-card draft">
              <span className="stat-number">{stats.draft}</span>
              <span className="stat-label">Draft</span>
            </div>
            <div className="stat-card confirmed">
              <span className="stat-number">{stats.confirmed}</span>
              <span className="stat-label">Confirmed</span>
            </div>
            <div className="stat-card production">
              <span className="stat-number">{stats.inProduction}</span>
              <span className="stat-label">In Production</span>
            </div>
            <div className="stat-card hold">
              <span className="stat-number">{stats.onHold}</span>
              <span className="stat-label">On Hold</span>
            </div>
            <div className="stat-card cancelled">
              <span className="stat-number">{stats.cancelled}</span>
              <span className="stat-label">Cancelled</span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="content-header">
            <div className="search-filter-row">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
                <option value="In Production">In Production</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              ➕ Create Order
            </button>
          </div>

          {/* Orders Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Deadline</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="order-id">{order.id}</td>
                    <td>{order.customerName}</td>
                    <td>{order.productName}</td>
                    <td>{order.quantity.toLocaleString()}</td>
                    <td>{order.deadline}</td>
                    <td>
                      <span className={`priority-badge ${getPriorityClass(order.priority)}`}>
                        {order.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <div className="progress-cell">
                        <div className="progress-bar-small">
                          <div
                            className="progress-fill"
                            style={{ width: `${order.progress}%` }}
                          ></div>
                        </div>
                        <span>{order.progress}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {/* Edit */}
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleEditOrder(order)}
                          title="Edit"
                        >
                          ✏️
                        </button>

                        {/* Confirm (only for Draft) */}
                        {order.status === "Draft" && (
                          <button
                            className="btn-action btn-confirm"
                            onClick={() => handleConfirmOrder(order.id)}
                            title="Confirm Order"
                          >
                            ✅
                          </button>
                        )}

                        {/* Hold (for In Production) */}
                        {order.status === "In Production" && (
                          <button
                            className="btn-action btn-hold"
                            onClick={() => handleHoldOrder(order.id)}
                            title="Hold Order"
                          >
                            ⏸️
                          </button>
                        )}

                        {/* Resume (for On Hold) */}
                        {order.status === "On Hold" && (
                          <button
                            className="btn-action btn-resume"
                            onClick={() => handleResumeOrder(order.id)}
                            title="Resume Order"
                          >
                            ▶️
                          </button>
                        )}

                        {/* Cancel (not for Completed/Cancelled) */}
                        {!["Completed", "Cancelled"].includes(order.status) && (
                          <button
                            className="btn-action btn-cancel"
                            onClick={() => handleCancelOrder(order.id)}
                            title="Cancel Order"
                          >
                            ❌
                          </button>
                        )}

                        {/* Delete (only for Draft/Cancelled) */}
                        {["Draft", "Cancelled"].includes(order.status) && (
                          <button
                            className="btn-action btn-delete"
                            onClick={() => handleDeleteOrder(order.id)}
                            title="Delete Order"
                          >
                            🗑️
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

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>➕ Create New Order</h2>
              <button className="close-button" onClick={() => setShowCreateModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Customer Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="Enter product name"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="Enter quantity"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Deadline *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleCreateOrder}>
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>✏️ Edit Order - {editingOrder?.id}</h2>
              <button className="close-button" onClick={() => setShowEditModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Customer Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Deadline *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleSaveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal modal-confirm">
            <div className="modal-header">
              <h2>
                {confirmAction.type === "cancel" && "⚠️ Cancel Order"}
                {confirmAction.type === "hold" && "⏸️ Hold Order"}
                {confirmAction.type === "delete" && "🗑️ Delete Order"}
              </h2>
            </div>
            <div className="modal-body">
              <p className="confirm-message">
                {confirmAction.type === "cancel" &&
                  `Are you sure you want to cancel order ${confirmAction.orderId}? This action cannot be undone.`}
                {confirmAction.type === "hold" &&
                  `Are you sure you want to put order ${confirmAction.orderId} on hold?`}
                {confirmAction.type === "delete" &&
                  `Are you sure you want to permanently delete order ${confirmAction.orderId}?`}
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowConfirmModal(false)}
              >
                No, Go Back
              </button>
              <button
                className={`btn-confirm-action ${confirmAction.type === "delete" ? "btn-danger" : ""}`}
                onClick={executeConfirmAction}
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
