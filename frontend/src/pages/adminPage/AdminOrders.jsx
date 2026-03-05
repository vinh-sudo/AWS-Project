import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import AdminSidebar from "../../components/AdminSidebar/AdminSidebar";
import authService from "../../services/authService";
import adminService from "../../services/adminService";
import "./adminUser.css";

const AdminOrders = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ type: "", orderId: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    customerName: "", productType: "", quantity: "", deadline: "", priority: "Medium", items: [],
  });

  const [editingOrder, setEditingOrder] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getAllOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.response?.data?.message || err.response?.data || "Failed to load orders");
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const dispatch = useDispatch();
  const handleLogout = async () => { await dispatch(logout()); navigate("/login"); };

  const handleCreateOrder = async () => {
    try {
      setActionLoading(true);
      const orderData = {
        customerName: formData.customerName, productType: formData.productType,
        quantity: parseInt(formData.quantity),
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        priority: formData.priority,
        items: formData.items.filter((item) => item.productName && item.quantity).map((item) => ({
          productName: item.productName, quantity: parseInt(item.quantity),
          price: item.price ? parseFloat(item.price) : null,
        })),
      };
      await adminService.createOrder(orderData);
      setShowCreateModal(false);
      resetForm();
      fetchOrders();
      alert("Đơn hàng đã được tạo thành công!");
    } catch (err) {
      console.error("Error creating order:", err);
      alert(err.response?.data?.message || err.response?.data || "Failed to create order");
    } finally { setActionLoading(false); }
  };

  const handleConfirmOrder = async (orderId) => {
    try { setActionLoading(true); await adminService.confirmOrder(orderId); fetchOrders(); alert("Đơn hàng đã được xác nhận!");
    } catch (err) { console.error("Error confirming order:", err); alert(err.response?.data?.message || "Failed to confirm order");
    } finally { setActionLoading(false); }
  };

  const handleStartProduction = async (orderId) => {
    try { setActionLoading(true); await adminService.startProduction(orderId); fetchOrders(); alert("Đã bắt đầu sản xuất!");
    } catch (err) { console.error("Error starting production:", err); alert(err.response?.data?.message || "Failed to start production");
    } finally { setActionLoading(false); }
  };

  const handleCompleteOrder = async (orderId) => {
    try { setActionLoading(true); await adminService.completeOrder(orderId); fetchOrders(); alert("Đơn hàng đã hoàn thành!");
    } catch (err) { console.error("Error completing order:", err); alert(err.response?.data?.message || "Failed to complete order");
    } finally { setActionLoading(false); }
  };

  const handleCancelOrder = (orderId) => { setConfirmAction({ type: "cancel", orderId }); setShowConfirmModal(true); };
  const handleDeleteOrder = (orderId) => { setConfirmAction({ type: "delete", orderId }); setShowConfirmModal(true); };

  const executeConfirmAction = async () => {
    const { type, orderId } = confirmAction;
    try {
      setActionLoading(true);
      if (type === "cancel") { await adminService.cancelOrder(orderId); alert("Đơn hàng đã bị hủy!"); }
      else if (type === "delete") { await adminService.deleteOrder(orderId); alert("Đơn hàng đã bị xóa!"); }
      else if (type === "stop") {
        const res = await adminService.stopOrder(orderId);
        alert(`Đã dừng sản xuất đơn hàng #${orderId}. Lịch trình bị hủy: ${res.cancelledSchedules || 0}, đã dừng: ${res.stoppedSchedules || 0}`);
      } else if (type === "resume") {
        const res = await adminService.resumeOrder(orderId);
        alert(`Đã tiếp tục sản xuất đơn hàng #${orderId}. Lịch trình được khôi phục: ${res.resumedSchedules || 0}`);
      }
      fetchOrders();
    } catch (err) {
      console.error(`Error ${type} order:`, err);
      alert(err.response?.data?.message || err.response?.data || `Failed to ${type} order`);
    } finally {
      setActionLoading(false);
      setShowConfirmModal(false);
      setConfirmAction({ type: "", orderId: null });
    }
  };

  const handleEditOrder = (order) => {
    if (!["Draft", "Confirmed"].includes(order.status)) {
      alert("Chỉ có thể sửa đơn hàng ở trạng thái Draft hoặc Confirmed.");
      return;
    }
    setEditingOrder(order);
    setFormData({
      customerName: order.customerName, productType: order.productType,
      quantity: order.quantity?.toString() || "", deadline: order.deadline ? order.deadline.split("T")[0] : "",
      priority: order.priority || "Medium",
      items: order.items && order.items.length > 0
        ? order.items.map((item) => ({ productName: item.productName || "", quantity: item.quantity?.toString() || "", price: item.price?.toString() || "" }))
        : [],
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      setActionLoading(true);
      const orderData = {
        customerName: formData.customerName, productType: formData.productType,
        quantity: parseInt(formData.quantity),
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        priority: formData.priority,
        items: formData.items.filter((item) => item.productName && item.quantity).map((item) => ({
          productName: item.productName, quantity: parseInt(item.quantity),
          price: item.price ? parseFloat(item.price) : null,
        })),
      };
      await adminService.updateOrder(editingOrder.id, orderData);
      setShowEditModal(false);
      setEditingOrder(null);
      resetForm();
      fetchOrders();
      alert("Đơn hàng đã được cập nhật!");
    } catch (err) {
      console.error("Error updating order:", err);
      alert(err.response?.data?.message || err.response?.data || "Failed to update order");
    } finally { setActionLoading(false); }
  };

  const handleStopOrder = (orderId) => { setConfirmAction({ type: "stop", orderId }); setShowConfirmModal(true); };
  const handleResumeOrder = (orderId) => { setConfirmAction({ type: "resume", orderId }); setShowConfirmModal(true); };

  const handleViewDetail = async (orderId) => {
    try {
      const detail = await adminService.getOrderById(orderId);
      setDetailOrder(detail);
      setUploadedFiles([]);
      setShowDetailModal(true);
    } catch (err) {
      console.error("Error fetching order detail:", err);
      alert(err.response?.data?.message || "Failed to load order details");
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !detailOrder) return;
    setUploadLoading(true);
    const results = [];
    for (const file of files) {
      try {
        const res = await adminService.uploadOrderFile(detailOrder.id, file);
        results.push(res);
      } catch (err) {
        console.error(`Error uploading ${file.name}:`, err);
        alert(`Upload thất bại: ${file.name}. ${err.response?.data?.message || "Lỗi không xác định"}`);
      }
    }
    if (results.length > 0) {
      setUploadedFiles((prev) => [...prev, ...results]);
      alert(`Đã upload thành công ${results.length} file!`);
    }
    setUploadLoading(false);
    e.target.value = null;
  };

  const addItem = () => { setFormData({ ...formData, items: [...formData.items, { productName: "", quantity: "", price: "" }] }); };
  const removeItem = (index) => { setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) }); };
  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };
  const resetForm = () => { setFormData({ customerName: "", productType: "", quantity: "", deadline: "", priority: "Medium", items: [] }); };

  const getStatusClass = (status) => {
    switch (status) {
      case "Draft": return "status-draft"; case "Confirmed": return "status-confirmed";
      case "In Production": return "status-production"; case "Completed": return "status-completed";
      case "Cancelled": return "status-cancelled"; case "STOPPED": return "status-hold"; default: return "";
    }
  };

  const getStatusDisplay = (status) => { if (status === "STOPPED") return "Stopped"; return status || "Unknown"; };

  const getPriorityClass = (priority) => {
    switch (priority?.toUpperCase()) {
      case "URGENT": case "CRITICAL": return "priority-critical"; case "HIGH": return "priority-high";
      case "MEDIUM": return "priority-medium"; case "LOW": return "priority-low"; default: return "";
    }
  };

  const formatDate = (dateString) => { if (!dateString) return "-"; return new Date(dateString).toLocaleDateString("vi-VN"); };
  const formatCurrency = (value) => {
    if (value == null) return "-";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  const filteredOrders = orders.filter((order) => {
    const matchSearch = order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.productType?.toLowerCase().includes(searchTerm.toLowerCase()) || order.id?.toString().includes(searchTerm);
    const matchStatus = statusFilter === "All" || order.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: orders.length, draft: orders.filter((o) => o.status === "Draft").length,
    confirmed: orders.filter((o) => o.status === "Confirmed").length,
    inProduction: orders.filter((o) => o.status === "In Production").length,
    stopped: orders.filter((o) => o.status === "STOPPED").length,
    completed: orders.filter((o) => o.status === "Completed").length,
    cancelled: orders.filter((o) => o.status === "Cancelled").length,
  };

  const renderItemsForm = () => (
    <div className="form-group">
      <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Order Items</span>
        <button type="button" onClick={addItem} style={{
          background: "linear-gradient(135deg, #5ec8c4 0%, #f195b3 100%)", color: "white", border: "none",
          padding: "6px 14px", borderRadius: "12px", fontSize: "12px", fontWeight: "600", cursor: "pointer",
        }}>+ Add Item</button>
      </label>
      {formData.items.length === 0 && (
        <p style={{ color: "#999", fontSize: "13px", margin: "8px 0" }}>No items added. Click "Add Item" to add products.</p>
      )}
      {formData.items.map((item, index) => (
        <div key={index} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px",
          padding: "12px", background: "rgba(94, 200, 196, 0.05)", borderRadius: "12px" }}>
          <input type="text" className="form-input" placeholder="Product name" value={item.productName}
            onChange={(e) => updateItem(index, "productName", e.target.value)} style={{ flex: 2 }} />
          <input type="number" className="form-input" placeholder="Qty" value={item.quantity}
            onChange={(e) => updateItem(index, "quantity", e.target.value)} style={{ flex: 1 }} min="1" />
          <input type="number" className="form-input" placeholder="Price" value={item.price}
            onChange={(e) => updateItem(index, "price", e.target.value)} style={{ flex: 1 }} min="0" step="0.01" />
          <button type="button" onClick={() => removeItem(index)} style={{
            background: "rgba(255, 77, 79, 0.1)", border: "none", color: "#ff4d4f",
            padding: "8px", borderRadius: "8px", cursor: "pointer", fontSize: "14px",
          }}>✕</button>
        </div>
      ))}
    </div>
  );

  if (initialLoad && loading) {
    return (
      <div className="page-loading">
        <div className="loading-card">
          <div className="loading-dots"><div className="dot"></div><div className="dot"></div><div className="dot"></div></div>
          <p className="loading-text">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <AdminSidebar />

      <div className="admin-main">
        <header className="admin-header">
          <h1 className="header-title">📦 Order Management</h1>
          <div className="header-actions">
            <button className="header-icon-btn" onClick={fetchOrders} title="Refresh">🔄</button>
            <NotificationBell />
            <div className="user-menu">
              <div className="user-avatar"></div>
              <span className="user-name">{currentUser?.fullName || "Admin"}</span>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {error && (
            <div className="error-banner" style={{
              background: "#ffebee", color: "#c62828", padding: "12px 16px",
              borderRadius: "8px", marginBottom: "16px", display: "flex",
              justifyContent: "space-between", alignItems: "center",
            }}>
              <span>⚠️ {error}</span>
              <button onClick={fetchOrders} style={{
                background: "#c62828", color: "white", border: "none",
                padding: "6px 12px", borderRadius: "4px", cursor: "pointer",
              }}>Retry</button>
            </div>
          )}

          <div className="stats-row">
            <div className="stat-card"><span className="stat-number">{stats.total}</span><span className="stat-label">Total Orders</span></div>
            <div className="stat-card draft"><span className="stat-number">{stats.draft}</span><span className="stat-label">Draft</span></div>
            <div className="stat-card confirmed"><span className="stat-number">{stats.confirmed}</span><span className="stat-label">Confirmed</span></div>
            <div className="stat-card production"><span className="stat-number">{stats.inProduction}</span><span className="stat-label">In Production</span></div>
            <div className="stat-card hold"><span className="stat-number">{stats.stopped}</span><span className="stat-label">Stopped</span></div>
            <div className="stat-card completed"><span className="stat-number">{stats.completed}</span><span className="stat-label">Completed</span></div>
            <div className="stat-card cancelled"><span className="stat-number">{stats.cancelled}</span><span className="stat-label">Cancelled</span></div>
          </div>

          <div className="content-header">
            <div className="search-filter-row">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input type="text" placeholder="Search orders..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
              </div>
              <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
                <option value="In Production">In Production</option>
                <option value="STOPPED">Stopped</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>➕ Create Order</button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Customer</th><th>Product</th><th>Quantity</th><th>Deadline</th>
                  <th>Priority</th><th>Status</th><th>Created By</th><th>Total Price</th><th>Created</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan="11" style={{ textAlign: "center", padding: "40px", color: "#666" }}>No orders found</td></tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="order-id">#{order.id}</td>
                      <td>{order.customerName}</td>
                      <td>{order.productType}</td>
                      <td>{order.quantity?.toLocaleString()}</td>
                      <td>{formatDate(order.deadline)}</td>
                      <td><span className={`priority-badge ${getPriorityClass(order.priority)}`}>{order.priority}</span></td>
                      <td><span className={`status-badge ${getStatusClass(order.status)}`}>{getStatusDisplay(order.status)}</span></td>
                      <td>{order.createdByName || "—"}</td>
                      <td>{order.totalPrice != null ? formatCurrency(order.totalPrice) : "—"}</td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-action btn-view" onClick={() => handleViewDetail(order.id)} title="View Detail" disabled={actionLoading}>👁️</button>
                          {["Draft", "Confirmed"].includes(order.status) && (
                            <button className="btn-action btn-edit" onClick={() => handleEditOrder(order)} title="Edit" disabled={actionLoading}>✏️</button>
                          )}
                          {order.status === "Draft" && (
                            <button className="btn-action btn-confirm" onClick={() => handleConfirmOrder(order.id)} title="Confirm Order" disabled={actionLoading}>✅</button>
                          )}
                          {order.status === "Confirmed" && (
                            <button className="btn-action btn-start" onClick={() => handleStartProduction(order.id)} title="Start Production" disabled={actionLoading}>▶️</button>
                          )}
                          {order.status === "In Production" && (
                            <>
                              <button className="btn-action btn-complete" onClick={() => handleCompleteOrder(order.id)} title="Complete Order" disabled={actionLoading}>✔️</button>
                              <button className="btn-action btn-stop" onClick={() => handleStopOrder(order.id)} title="Stop Production" disabled={actionLoading}>⏹️</button>
                            </>
                          )}
                          {order.status === "STOPPED" && (
                            <button className="btn-action btn-resume" onClick={() => handleResumeOrder(order.id)} title="Resume Production" disabled={actionLoading}>🔄</button>
                          )}
                          {!["Completed", "Cancelled", "STOPPED"].includes(order.status) && (
                            <button className="btn-action btn-cancel" onClick={() => handleCancelOrder(order.id)} title="Cancel Order" disabled={actionLoading}>❌</button>
                          )}
                          {["Draft", "Cancelled"].includes(order.status) && (
                            <button className="btn-action btn-delete" onClick={() => handleDeleteOrder(order.id)} title="Delete Order" disabled={actionLoading}>🗑️</button>
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
              <button className="close-button" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Customer Name *</label>
                <input type="text" className="form-input" value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} placeholder="Enter customer name" />
              </div>
              <div className="form-group">
                <label className="form-label">Product Type *</label>
                <input type="text" className="form-input" value={formData.productType}
                  onChange={(e) => setFormData({ ...formData, productType: e.target.value })} placeholder="Enter product type" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input type="number" className="form-input" value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} placeholder="Enter quantity" />
                </div>
                <div className="form-group">
                  <label className="form-label">Deadline</label>
                  <input type="date" className="form-input" value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                  <option value="Low">Low</option><option value="Medium">Medium</option>
                  <option value="High">High</option><option value="Urgent">Urgent</option>
                </select>
              </div>
              {renderItemsForm()}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowCreateModal(false)} disabled={actionLoading}>Cancel</button>
              <button className="btn-save" onClick={handleCreateOrder} disabled={actionLoading}>
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
              <button className="close-button" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Customer Name *</label>
                <input type="text" className="form-input" value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Product Type *</label>
                <input type="text" className="form-input" value={formData.productType}
                  onChange={(e) => setFormData({ ...formData, productType: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input type="number" className="form-input" value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Deadline</label>
                  <input type="date" className="form-input" value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                  <option value="Low">Low</option><option value="Medium">Medium</option>
                  <option value="High">High</option><option value="Urgent">Urgent</option>
                </select>
              </div>
              {renderItemsForm()}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)} disabled={actionLoading}>Cancel</button>
              <button className="btn-save" onClick={handleSaveEdit} disabled={actionLoading}>
                {actionLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Order Modal */}
      {showDetailModal && detailOrder && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h2>📋 Order Detail #{detailOrder.id}</h2>
              <button className="close-button" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-row"><span className="detail-label">Customer:</span><span className="detail-value">{detailOrder.customerName}</span></div>
                <div className="detail-row"><span className="detail-label">Product Type:</span><span className="detail-value">{detailOrder.productType}</span></div>
                <div className="detail-row"><span className="detail-label">Quantity:</span><span className="detail-value">{detailOrder.quantity?.toLocaleString()}</span></div>
                <div className="detail-row"><span className="detail-label">Deadline:</span><span className="detail-value">{formatDate(detailOrder.deadline)}</span></div>
                <div className="detail-row"><span className="detail-label">Priority:</span><span className={`priority-badge ${getPriorityClass(detailOrder.priority)}`}>{detailOrder.priority}</span></div>
                <div className="detail-row"><span className="detail-label">Status:</span><span className={`status-badge ${getStatusClass(detailOrder.status)}`}>{getStatusDisplay(detailOrder.status)}</span></div>
                <div className="detail-row"><span className="detail-label">Created By:</span><span className="detail-value">{detailOrder.createdByName || "—"}</span></div>
                <div className="detail-row"><span className="detail-label">Total Price:</span><span className="detail-value">{detailOrder.totalPrice != null ? formatCurrency(detailOrder.totalPrice) : "—"}</span></div>
                <div className="detail-row"><span className="detail-label">Created At:</span><span className="detail-value">{formatDate(detailOrder.createdAt)}</span></div>
                <div className="detail-row"><span className="detail-label">Updated At:</span><span className="detail-value">{formatDate(detailOrder.updatedAt)}</span></div>
              </div>

              {detailOrder.items && detailOrder.items.length > 0 && (
                <div className="detail-items-section">
                  <h3>📦 Order Items ({detailOrder.items.length})</h3>
                  <table className="data-table items-table">
                    <thead><tr><th>#</th><th>Product Name</th><th>Quantity</th><th>Price</th><th>Subtotal</th></tr></thead>
                    <tbody>
                      {detailOrder.items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td>{idx + 1}</td><td>{item.productName}</td><td>{item.quantity?.toLocaleString()}</td>
                          <td>{formatCurrency(item.price)}</td><td>{formatCurrency((item.quantity || 0) * (item.price || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="detail-items-section">
                <h3>📎 Files (SOP / BOM)</h3>
                {uploadedFiles.length > 0 && (
                  <div className="uploaded-files-list">
                    {uploadedFiles.map((file, idx) => (
                      <div key={file.id || idx} className="uploaded-file-item">
                        <span className="file-icon">📄</span>
                        <div className="file-info">
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="file-name-link">{file.fileName}</a>
                          <span className="file-meta">Uploaded: {file.uploadedAt ? new Date(file.uploadedAt).toLocaleString("vi-VN") : "—"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {uploadedFiles.length === 0 && (
                  <p style={{ color: "#999", fontSize: "13px", margin: "8px 0" }}>Chưa có file nào được upload trong phiên này.</p>
                )}
                <div className="file-upload-area">
                  <label className="btn-upload-file" htmlFor="order-file-upload">
                    {uploadLoading ? (<><span className="spinner-small"></span>Đang upload...</>) : (<>📤 Upload File</>)}
                  </label>
                  <input id="order-file-upload" type="file" multiple onChange={handleFileUpload} disabled={uploadLoading} style={{ display: "none" }} />
                  <span className="upload-hint">Hỗ trợ nhiều file. Click để chọn file SOP/BOM.</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowDetailModal(false)}>Close</button>
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
                {confirmAction.type === "stop" && "⏹️ Stop Production"}
                {confirmAction.type === "resume" && "🔄 Resume Production"}
              </h2>
            </div>
            <div className="modal-body">
              <p className="confirm-message">
                {confirmAction.type === "cancel" && `Are you sure you want to cancel order #${confirmAction.orderId}? This action cannot be undone.`}
                {confirmAction.type === "delete" && `Are you sure you want to permanently delete order #${confirmAction.orderId}?`}
                {confirmAction.type === "stop" && `Are you sure you want to stop production for order #${confirmAction.orderId}? Related schedules will be stopped.`}
                {confirmAction.type === "resume" && `Are you sure you want to resume production for order #${confirmAction.orderId}? Stopped schedules will be resumed.`}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowConfirmModal(false)} disabled={actionLoading}>No, Go Back</button>
              <button className={`btn-confirm-action ${confirmAction.type === "delete" ? "btn-danger" : ""}`}
                onClick={executeConfirmAction} disabled={actionLoading}>
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
