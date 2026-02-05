import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import adminService from "../../services/adminService";
import imsLogo from "../../assets/ims2.jpg";
import dashboardIcon from "../../assets/dashboard.jpg";
import userIcon from "../../assets/user.jpg";
import auditIcon from "../../assets/auditlog.jpg";
import "./adminUser.css";

const AdminOrders = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  // Orders state
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState({
    type: "",
    orderId: null,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    customerName: "",
    productType: "",
    quantity: "",
    deadline: "",
    priority: "Medium",
  });

  const [editingOrder, setEditingOrder] = useState(null);

  // Fetch orders on mount
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

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  // Create new order
  const handleCreateOrder = async () => {
    try {
      setActionLoading(true);
      const orderData = {
        customerName: formData.customerName,
        productType: formData.productType,
        quantity: parseInt(formData.quantity),
        deadline: formData.deadline
          ? new Date(formData.deadline).toISOString()
          : null,
        priority: formData.priority,
      };
      await adminService.createOrder(orderData);
      setShowCreateModal(false);
      resetForm();
      fetchOrders();
      alert("Đơn hàng đã được tạo thành công!");
    } catch (err) {
      console.error("Error creating order:", err);
      alert(err.response?.data?.message || "Failed to create order");
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm order (Draft -> Confirmed)
  const handleConfirmOrder = async (orderId) => {
    try {
      setActionLoading(true);
      await adminService.confirmOrder(orderId);
      fetchOrders();
      alert("Đơn hàng đã được xác nhận!");
    } catch (err) {
      console.error("Error confirming order:", err);
      alert(err.response?.data?.message || "Failed to confirm order");
    } finally {
      setActionLoading(false);
    }
  };

  // Start production (Confirmed -> In Production)
  const handleStartProduction = async (orderId) => {
    try {
      setActionLoading(true);
      await adminService.startProduction(orderId);
      fetchOrders();
      alert("Đã bắt đầu sản xuất!");
    } catch (err) {
      console.error("Error starting production:", err);
      alert(err.response?.data?.message || "Failed to start production");
    } finally {
      setActionLoading(false);
    }
  };

  // Complete order
  const handleCompleteOrder = async (orderId) => {
    try {
      setActionLoading(true);
      await adminService.completeOrder(orderId);
      fetchOrders();
      alert("Đơn hàng đã hoàn thành!");
    } catch (err) {
      console.error("Error completing order:", err);
      alert(err.response?.data?.message || "Failed to complete order");
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel order
  const handleCancelOrder = (orderId) => {
    setConfirmAction({ type: "cancel", orderId });
    setShowConfirmModal(true);
  };

  // Delete order
  const handleDeleteOrder = (orderId) => {
    setConfirmAction({ type: "delete", orderId });
    setShowConfirmModal(true);
  };

  // Execute confirm action
  const executeConfirmAction = async () => {
    const { type, orderId } = confirmAction;

    try {
      setActionLoading(true);
      if (type === "cancel") {
        await adminService.cancelOrder(orderId);
        alert("Đơn hàng đã bị hủy!");
      } else if (type === "delete") {
        await adminService.deleteOrder(orderId);
        alert("Đơn hàng đã bị xóa!");
      }
      fetchOrders();
    } catch (err) {
      console.error(`Error ${type} order:`, err);
      alert(err.response?.data?.message || `Failed to ${type} order`);
    } finally {
      setActionLoading(false);
      setShowConfirmModal(false);
      setConfirmAction({ type: "", orderId: null });
    }
  };

  // Edit order
  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setFormData({
      customerName: order.customerName,
      productType: order.productType,
      quantity: order.quantity?.toString() || "",
      deadline: order.deadline ? order.deadline.split("T")[0] : "",
      priority: order.priority || "Medium",
    });
    setShowEditModal(true);
  };

  // Save edited order
  const handleSaveEdit = async () => {
    try {
      setActionLoading(true);
      const orderData = {
        customerName: formData.customerName,
        productType: formData.productType,
        quantity: parseInt(formData.quantity),
        deadline: formData.deadline
          ? new Date(formData.deadline).toISOString()
          : null,
        priority: formData.priority,
      };
      await adminService.updateOrder(editingOrder.id, orderData);
      setShowEditModal(false);
      setEditingOrder(null);
      resetForm();
      fetchOrders();
      alert("Đơn hàng đã được cập nhật!");
    } catch (err) {
      console.error("Error updating order:", err);
      alert(err.response?.data?.message || "Failed to update order");
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: "",
      productType: "",
      quantity: "",
      deadline: "",
      priority: "Medium",
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "DRAFT":
        return "status-draft";
      case "CONFIRMED":
        return "status-confirmed";
      case "IN_PRODUCTION":
        return "status-production";
      case "ON_HOLD":
        return "status-hold";
      case "COMPLETED":
        return "status-completed";
      case "CANCELLED":
        return "status-cancelled";
      default:
        return "";
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case "DRAFT":
        return "Draft";
      case "CONFIRMED":
        return "Confirmed";
      case "IN_PRODUCTION":
        return "In Production";
      case "ON_HOLD":
        return "On Hold";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority?.toUpperCase()) {
      case "URGENT":
      case "CRITICAL":
        return "priority-critical";
      case "HIGH":
        return "priority-high";
      case "MEDIUM":
        return "priority-medium";
      case "LOW":
        return "priority-low";
      default:
        return "";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchSearch =
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.productType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id?.toString().includes(searchTerm);
    const matchStatus = statusFilter === "All" || order.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const stats = {
    total: orders.length,
    draft: orders.filter((o) => o.status === "DRAFT").length,
    confirmed: orders.filter((o) => o.status === "CONFIRMED").length,
    inProduction: orders.filter((o) => o.status === "IN_PRODUCTION").length,
    onHold: orders.filter((o) => o.status === "ON_HOLD").length,
    completed: orders.filter((o) => o.status === "COMPLETED").length,
    cancelled: orders.filter((o) => o.status === "CANCELLED").length,
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-card">
          <img src={imsLogo} alt="Logo" className="loading-logo" />
          <h2 className="loading-title">IMS Admin</h2>
          <div className="loading-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
          <p className="loading-text">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <img src={imsLogo} alt="Logo" className="sidebar-logo" />
          <div className="sidebar-title">IMS Admin</div>
        </div>

        <nav className="sidebar-nav">
          <div
            className="nav-item"
            onClick={() => navigate("/admin/dashboard")}
          >
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
          </div>{" "}
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
            <button
              className="header-icon-btn"
              onClick={fetchOrders}
              title="Refresh"
            >
              🔄
            </button>
            <button className="header-icon-btn">🔔</button>
            <div className="user-menu">
              <div className="user-avatar"></div>
              <span className="user-name">
                {currentUser?.fullName || "Admin"}
              </span>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {error && (
            <div
              className="error-banner"
              style={{
                background: "#ffebee",
                color: "#c62828",
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>⚠️ {error}</span>
              <button
                onClick={fetchOrders}
                style={{
                  background: "#c62828",
                  color: "white",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          )}

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
                <option value="DRAFT">Draft</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="IN_PRODUCTION">In Production</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <button
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              ➕ Create Order
            </button>
          </div>

          {/* Orders Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Deadline</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      style={{
                        textAlign: "center",
                        padding: "40px",
                        color: "#666",
                      }}
                    >
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="order-id">#{order.id}</td>
                      <td>{order.customerName}</td>
                      <td>{order.productType}</td>
                      <td>{order.quantity?.toLocaleString()}</td>
                      <td>{formatDate(order.deadline)}</td>
                      <td>
                        <span
                          className={`priority-badge ${getPriorityClass(order.priority)}`}
                        >
                          {order.priority}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${getStatusClass(order.status)}`}
                        >
                          {getStatusDisplay(order.status)}
                        </span>
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          {/* Edit */}
                          <button
                            className="btn-action btn-edit"
                            onClick={() => handleEditOrder(order)}
                            title="Edit"
                            disabled={actionLoading}
                          >
                            ✏️
                          </button>

                          {/* Confirm (only for Draft) */}
                          {order.status === "DRAFT" && (
                            <button
                              className="btn-action btn-confirm"
                              onClick={() => handleConfirmOrder(order.id)}
                              title="Confirm Order"
                              disabled={actionLoading}
                            >
                              ✅
                            </button>
                          )}

                          {/* Start Production (only for Confirmed) */}
                          {order.status === "CONFIRMED" && (
                            <button
                              className="btn-action btn-start"
                              onClick={() => handleStartProduction(order.id)}
                              title="Start Production"
                              disabled={actionLoading}
                            >
                              ▶️
                            </button>
                          )}

                          {/* Complete (only for In Production) */}
                          {order.status === "IN_PRODUCTION" && (
                            <button
                              className="btn-action btn-complete"
                              onClick={() => handleCompleteOrder(order.id)}
                              title="Complete Order"
                              disabled={actionLoading}
                            >
                              ✔️
                            </button>
                          )}

                          {/* Cancel (not for Completed/Cancelled) */}
                          {!["COMPLETED", "CANCELLED"].includes(
                            order.status,
                          ) && (
                            <button
                              className="btn-action btn-cancel"
                              onClick={() => handleCancelOrder(order.id)}
                              title="Cancel Order"
                              disabled={actionLoading}
                            >
                              ❌
                            </button>
                          )}

                          {/* Delete (only for Draft/Cancelled) */}
                          {["DRAFT", "CANCELLED"].includes(order.status) && (
                            <button
                              className="btn-action btn-delete"
                              onClick={() => handleDeleteOrder(order.id)}
                              title="Delete Order"
                              disabled={actionLoading}
                            >
                              🗑️
                            </button>
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
      </div>

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>➕ Create New Order</h2>
              <button
                className="close-button"
                onClick={() => setShowCreateModal(false)}
              >
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
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                  placeholder="Enter customer name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Product Type *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.productType}
                  onChange={(e) =>
                    setFormData({ ...formData, productType: e.target.value })
                  }
                  placeholder="Enter product type"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    placeholder="Enter quantity"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Deadline</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowCreateModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleCreateOrder}
                disabled={actionLoading}
              >
                {actionLoading ? "Creating..." : "Create Order"}
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
              <h2>✏️ Edit Order #{editingOrder?.id}</h2>
              <button
                className="close-button"
                onClick={() => setShowEditModal(false)}
              >
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
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Product Type *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.productType}
                  onChange={(e) =>
                    setFormData({ ...formData, productType: e.target.value })
                  }
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Deadline</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowEditModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleSaveEdit}
                disabled={actionLoading}
              >
                {actionLoading ? "Saving..." : "Save Changes"}
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
                {confirmAction.type === "delete" && "🗑️ Delete Order"}
              </h2>
            </div>
            <div className="modal-body">
              <p className="confirm-message">
                {confirmAction.type === "cancel" &&
                  `Are you sure you want to cancel order #${confirmAction.orderId}? This action cannot be undone.`}
                {confirmAction.type === "delete" &&
                  `Are you sure you want to permanently delete order #${confirmAction.orderId}?`}
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowConfirmModal(false)}
                disabled={actionLoading}
              >
                No, Go Back
              </button>
              <button
                className={`btn-confirm-action ${confirmAction.type === "delete" ? "btn-danger" : ""}`}
                onClick={executeConfirmAction}
                disabled={actionLoading}
              >
                {actionLoading ? "Processing..." : "Yes, Proceed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
