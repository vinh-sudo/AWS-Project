import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import AdminSidebar from "../../components/AdminSidebar/AdminSidebar";
import authService from "../../services/authService";
import adminService from "../../services/adminService";
import "./AdminOrders.css";

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

  const getStatusKey = (status) => {
    switch (status) {
      case "Draft": return "draft";
      case "Confirmed": return "confirmed";
      case "In Production": return "production";
      case "Completed": return "completed";
      case "Cancelled": return "cancelled";
      case "STOPPED": return "stopped";
      default: return "";
    }
  };

  const getStatusDisplay = (status) => { if (status === "STOPPED") return "Stopped"; return status || "Unknown"; };

  const getPriorityKey = (priority) => {
    switch (priority?.toUpperCase()) {
      case "URGENT": case "CRITICAL": return "critical";
      case "HIGH": return "high";
      case "MEDIUM": return "medium";
      case "LOW": return "low";
      default: return "";
    }
  };

  const formatDate = (dateString) => { if (!dateString) return "—"; return new Date(dateString).toLocaleDateString("vi-VN"); };
  const formatCurrency = (value) => {
    if (value == null) return "—";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  const getUserInitial = () => {
    const name = currentUser?.fullName || "A";
    return name.charAt(0).toUpperCase();
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

  const getConfirmConfig = () => {
    switch (confirmAction.type) {
      case "cancel": return { icon: "⚠️", iconClass: "warning", title: "Cancel Order", btnClass: "ao-btn-warning", btnText: "Yes, Cancel" };
      case "delete": return { icon: "🗑", iconClass: "danger", title: "Delete Order", btnClass: "ao-btn-danger", btnText: "Yes, Delete" };
      case "stop": return { icon: "⏸", iconClass: "warning", title: "Stop Production", btnClass: "ao-btn-warning", btnText: "Yes, Stop" };
      case "resume": return { icon: "▶", iconClass: "info", title: "Resume Production", btnClass: "ao-btn-save", btnText: "Yes, Resume" };
      default: return { icon: "?", iconClass: "info", title: "Confirm", btnClass: "ao-btn-save", btnText: "Confirm" };
    }
  };

  const getConfirmMessage = () => {
    const id = confirmAction.orderId;
    switch (confirmAction.type) {
      case "cancel": return (<>Are you sure you want to cancel order <strong>#{id}</strong>? This action cannot be undone.</>);
      case "delete": return (<>Are you sure you want to permanently delete order <strong>#{id}</strong>?</>);
      case "stop": return (<>Are you sure you want to stop production for order <strong>#{id}</strong>? Related schedules will be stopped.</>);
      case "resume": return (<>Are you sure you want to resume production for order <strong>#{id}</strong>? Stopped schedules will be resumed.</>);
      default: return "Are you sure?";
    }
  };

  /* === SVG Icons === */
  const Icons = {
    search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
    plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
    refresh: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.3"/></svg>,
    eye: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    play: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
    checkCircle: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    stop: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>,
    rotateCw: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
    xCircle: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
    close: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    upload: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
    package: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    file: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    minus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  };

  /* === Items Form === */
  const renderItemsForm = () => (
    <div className="ao-form-group">
      <div className="ao-items-header">
        <div>
          <span className="ao-items-title">Order Items</span>
          {formData.items.length > 0 && <span className="ao-items-count">{formData.items.length}</span>}
        </div>
        <button type="button" className="ao-btn-add-item" onClick={addItem}>
          {Icons.plus} Add Item
        </button>
      </div>
      {formData.items.length === 0 && (
        <div className="ao-items-empty">No items added yet. Click "Add Item" to add products to this order.</div>
      )}
      {formData.items.map((item, index) => (
        <div key={index} className="ao-item-row">
          <input type="text" className="ao-form-input" placeholder="Product name" value={item.productName}
            onChange={(e) => updateItem(index, "productName", e.target.value)} style={{ flex: 2 }} />
          <input type="number" className="ao-form-input" placeholder="Qty" value={item.quantity}
            onChange={(e) => updateItem(index, "quantity", e.target.value)} style={{ flex: 1 }} min="1" />
          <input type="number" className="ao-form-input" placeholder="Price" value={item.price}
            onChange={(e) => updateItem(index, "price", e.target.value)} style={{ flex: 1 }} min="0" step="0.01" />
          <button type="button" className="ao-btn-remove-item" onClick={() => removeItem(index)} title="Remove">
            {Icons.minus}
          </button>
        </div>
      ))}
    </div>
  );

  /* === Order Form Fields (shared by Create & Edit) === */
  const renderOrderForm = () => (
    <>
      <div className="ao-form-group">
        <label className="ao-form-label">Customer Name <span className="ao-form-required">*</span></label>
        <input type="text" className="ao-form-input" value={formData.customerName}
          onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} placeholder="Enter customer name" />
      </div>
      <div className="ao-form-group">
        <label className="ao-form-label">Product Type <span className="ao-form-required">*</span></label>
        <input type="text" className="ao-form-input" value={formData.productType}
          onChange={(e) => setFormData({ ...formData, productType: e.target.value })} placeholder="Enter product type" />
      </div>
      <div className="ao-form-row">
        <div className="ao-form-group">
          <label className="ao-form-label">Quantity <span className="ao-form-required">*</span></label>
          <input type="number" className="ao-form-input" value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} placeholder="Enter quantity" min="1" />
        </div>
        <div className="ao-form-group">
          <label className="ao-form-label">Deadline</label>
          <input type="date" className="ao-form-input" value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} />
        </div>
      </div>
      <div className="ao-form-group">
        <label className="ao-form-label">Priority</label>
        <select className="ao-form-select" value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
          <option value="Low">Low</option><option value="Medium">Medium</option>
          <option value="High">High</option><option value="Urgent">Urgent</option>
        </select>
      </div>
      {renderItemsForm()}
    </>
  );

  /* === Loading Screen === */
  if (initialLoad && loading) {
    return (
      <div className="ao-loading">
        <div className="ao-loading-card">
          <div className="ao-spinner"></div>
          <p className="ao-loading-text">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <AdminSidebar />

      <div className="admin-main">
        {/* === Header === */}
        <header className="ao-header">
          <div className="ao-header-left">
            <div className="ao-header-icon">{Icons.package}</div>
            <div>
              <h1 className="ao-header-title">Order Management</h1>
              <p className="ao-header-subtitle">{orders.length} orders total · {stats.inProduction} in production</p>
            </div>
          </div>
          <div className="ao-header-right">
            <button className="ao-header-btn refresh" onClick={fetchOrders} title="Refresh">
              {Icons.refresh}
            </button>
            <NotificationBell />
            <div className="ao-user-pill">
              <div className="ao-user-avatar">{getUserInitial()}</div>
              <span className="ao-user-name">{currentUser?.fullName || "Admin"}</span>
            </div>
          </div>
        </header>

        {/* === Content === */}
        <div className="ao-content">
          {/* Error Banner */}
          {error && (
            <div className="ao-error-banner">
              <div className="ao-error-content">
                <div className="ao-error-icon">!</div>
                <span>{error}</span>
              </div>
              <button className="ao-error-retry" onClick={fetchOrders}>Retry</button>
            </div>
          )}          {/* Toolbar */}
          <div className="ao-toolbar">
            <div className="ao-toolbar-left">
              <div className="ao-search-box">
                <span className="ao-search-icon">{Icons.search}</span>
                <input type="text" className="ao-search-input" placeholder="Search by customer, product or ID..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <select className="ao-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
                <option value="In Production">In Production</option>
                <option value="STOPPED">Stopped</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <button className="ao-btn-create" onClick={() => setShowCreateModal(true)}>
              {Icons.plus} New Order
            </button>
          </div>

          {/* Table */}
          <div className="ao-table-wrapper">
            <table className="ao-table">
              <thead>
                <tr>
                  <th>ID</th><th>Customer</th><th>Product</th><th>Qty</th><th>Deadline</th>
                  <th>Priority</th><th>Status</th><th>Created By</th><th>Total Price</th><th>Created</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="11">
                      <div className="ao-empty-state">
                        <div className="ao-empty-icon">{Icons.package}</div>
                        <p className="ao-empty-title">No orders found</p>
                        <p className="ao-empty-desc">Try adjusting your search or filter criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td><span className="ao-order-id">#{order.id}</span></td>
                      <td><span className="ao-customer-name">{order.customerName}</span></td>
                      <td><span className="ao-product-type">{order.productType}</span></td>
                      <td><span className="ao-quantity">{order.quantity?.toLocaleString()}</span></td>
                      <td><span className="ao-date">{formatDate(order.deadline)}</span></td>
                      <td>
                        <span className={`ao-priority ${getPriorityKey(order.priority)}`}>
                          {order.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`ao-status ${getStatusKey(order.status)}`}>
                          <span className="ao-status-dot"></span>
                          {getStatusDisplay(order.status)}
                        </span>
                      </td>
                      <td><span className="ao-creator">{order.createdByName || "—"}</span></td>
                      <td><span className="ao-price">{order.totalPrice != null ? formatCurrency(order.totalPrice) : "—"}</span></td>
                      <td><span className="ao-date">{formatDate(order.createdAt)}</span></td>
                      <td>
                        <div className="ao-actions">
                          <button className="ao-action-btn view" onClick={() => handleViewDetail(order.id)} title="View" disabled={actionLoading}>{Icons.eye}</button>
                          {["Draft", "Confirmed"].includes(order.status) && (
                            <button className="ao-action-btn edit" onClick={() => handleEditOrder(order)} title="Edit" disabled={actionLoading}>{Icons.edit}</button>
                          )}
                          {order.status === "Draft" && (
                            <button className="ao-action-btn confirm" onClick={() => handleConfirmOrder(order.id)} title="Confirm" disabled={actionLoading}>{Icons.check}</button>
                          )}
                          {order.status === "Confirmed" && (
                            <button className="ao-action-btn start" onClick={() => handleStartProduction(order.id)} title="Start" disabled={actionLoading}>{Icons.play}</button>
                          )}
                          {order.status === "In Production" && (
                            <>
                              <button className="ao-action-btn complete" onClick={() => handleCompleteOrder(order.id)} title="Complete" disabled={actionLoading}>{Icons.checkCircle}</button>
                              <button className="ao-action-btn stop" onClick={() => handleStopOrder(order.id)} title="Stop" disabled={actionLoading}>{Icons.stop}</button>
                            </>
                          )}
                          {order.status === "STOPPED" && (
                            <button className="ao-action-btn resume" onClick={() => handleResumeOrder(order.id)} title="Resume" disabled={actionLoading}>{Icons.rotateCw}</button>
                          )}
                          {!["Completed", "Cancelled", "STOPPED"].includes(order.status) && (
                            <button className="ao-action-btn cancel" onClick={() => handleCancelOrder(order.id)} title="Cancel" disabled={actionLoading}>{Icons.xCircle}</button>
                          )}
                          {["Draft", "Cancelled"].includes(order.status) && (
                            <button className="ao-action-btn delete" onClick={() => handleDeleteOrder(order.id)} title="Delete" disabled={actionLoading}>{Icons.trash}</button>
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

      {/* ================================
          CREATE ORDER MODAL
          ================================ */}
      {showCreateModal && (
        <div className="ao-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="ao-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ao-modal-header">
              <div className="ao-modal-header-left">
                <div className="ao-modal-icon create">{Icons.plus}</div>
                <div>
                  <h2 className="ao-modal-title">Create New Order</h2>
                  <p className="ao-modal-subtitle">Fill in the details below</p>
                </div>
              </div>
              <button className="ao-modal-close" onClick={() => setShowCreateModal(false)}>{Icons.close}</button>
            </div>            <div className="ao-modal-body">
              {renderOrderForm()}

              {/* File Upload */}
              <div className="ao-detail-section">
                <h3 className="ao-detail-section-title">
                  <span className="ao-detail-section-icon">{Icons.file}</span>
                  Files (SOP / BOM)
                </h3>
                {uploadedFiles.length > 0 && (
                  <div className="ao-file-list">
                    {uploadedFiles.map((file, idx) => (
                      <div key={file.id || idx} className="ao-file-item">
                        <div className="ao-file-icon">{Icons.file}</div>
                        <div className="ao-file-info">
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="ao-file-name">{file.fileName}</a>
                          <span className="ao-file-meta">Uploaded: {file.uploadedAt ? new Date(file.uploadedAt).toLocaleString("vi-VN") : "—"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="ao-upload-area">
                  <label className="ao-btn-upload" htmlFor="create-order-file-upload">
                    {uploadLoading ? (<><span className="ao-spinner-sm"></span> Uploading...</>) : (<>{Icons.upload} Upload File</>)}
                  </label>
                  <input id="create-order-file-upload" type="file" multiple onChange={handleFileUpload} disabled={uploadLoading} style={{ display: "none" }} />
                  <span className="ao-upload-hint">Supports multiple files. Click to select SOP/BOM files.</span>
                </div>
              </div>
            </div>
            <div className="ao-modal-footer">
              <button className="ao-btn-cancel" onClick={() => setShowCreateModal(false)} disabled={actionLoading}>Cancel</button>
              <button className="ao-btn-save" onClick={handleCreateOrder} disabled={actionLoading}>
                {actionLoading && <span className="ao-spinner-sm"></span>}
                {actionLoading ? "Creating..." : "Create Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================
          EDIT ORDER MODAL
          ================================ */}
      {showEditModal && (
        <div className="ao-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="ao-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ao-modal-header">
              <div className="ao-modal-header-left">
                <div className="ao-modal-icon edit">{Icons.edit}</div>
                <div>
                  <h2 className="ao-modal-title">Edit Order</h2>
                  <p className="ao-modal-subtitle">Order #{editingOrder?.id}</p>
                </div>
              </div>
              <button className="ao-modal-close" onClick={() => setShowEditModal(false)}>{Icons.close}</button>
            </div>
            <div className="ao-modal-body">
              {renderOrderForm()}
            </div>
            <div className="ao-modal-footer">
              <button className="ao-btn-cancel" onClick={() => setShowEditModal(false)} disabled={actionLoading}>Cancel</button>
              <button className="ao-btn-save" onClick={handleSaveEdit} disabled={actionLoading}>
                {actionLoading && <span className="ao-spinner-sm"></span>}
                {actionLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================
          DETAIL ORDER MODAL
          ================================ */}
      {showDetailModal && detailOrder && (
        <div className="ao-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="ao-modal large" onClick={(e) => e.stopPropagation()}>
            <div className="ao-modal-header">
              <div className="ao-modal-header-left">
                <div className="ao-modal-icon detail">{Icons.eye}</div>
                <div>
                  <h2 className="ao-modal-title">Order #{detailOrder.id}</h2>
                  <p className="ao-modal-subtitle">{detailOrder.customerName} · {getStatusDisplay(detailOrder.status)}</p>
                </div>
              </div>
              <button className="ao-modal-close" onClick={() => setShowDetailModal(false)}>{Icons.close}</button>
            </div>
            <div className="ao-modal-body">
              <div className="ao-detail-grid">
                <div className="ao-detail-item">
                  <span className="ao-detail-label">Customer</span>
                  <span className="ao-detail-value">{detailOrder.customerName}</span>
                </div>
                <div className="ao-detail-item">
                  <span className="ao-detail-label">Product Type</span>
                  <span className="ao-detail-value">{detailOrder.productType}</span>
                </div>
                <div className="ao-detail-item">
                  <span className="ao-detail-label">Quantity</span>
                  <span className="ao-detail-value">{detailOrder.quantity?.toLocaleString()}</span>
                </div>
                <div className="ao-detail-item">
                  <span className="ao-detail-label">Deadline</span>
                  <span className="ao-detail-value">{formatDate(detailOrder.deadline)}</span>
                </div>
                <div className="ao-detail-item">
                  <span className="ao-detail-label">Priority</span>
                  <span className={`ao-priority ${getPriorityKey(detailOrder.priority)}`}>{detailOrder.priority}</span>
                </div>
                <div className="ao-detail-item">
                  <span className="ao-detail-label">Status</span>
                  <span className={`ao-status ${getStatusKey(detailOrder.status)}`}>
                    <span className="ao-status-dot"></span>
                    {getStatusDisplay(detailOrder.status)}
                  </span>
                </div>
                <div className="ao-detail-item">
                  <span className="ao-detail-label">Created By</span>
                  <span className="ao-detail-value">{detailOrder.createdByName || "—"}</span>
                </div>
                <div className="ao-detail-item">
                  <span className="ao-detail-label">Total Price</span>
                  <span className="ao-detail-value" style={{ fontWeight: 700 }}>{detailOrder.totalPrice != null ? formatCurrency(detailOrder.totalPrice) : "—"}</span>
                </div>
                <div className="ao-detail-item">
                  <span className="ao-detail-label">Created At</span>
                  <span className="ao-detail-value">{formatDate(detailOrder.createdAt)}</span>
                </div>
                <div className="ao-detail-item">
                  <span className="ao-detail-label">Updated At</span>
                  <span className="ao-detail-value">{formatDate(detailOrder.updatedAt)}</span>
                </div>
              </div>

              {/* Order Items */}
              {detailOrder.items && detailOrder.items.length > 0 && (
                <div className="ao-detail-section">
                  <h3 className="ao-detail-section-title">
                    <span className="ao-detail-section-icon">{Icons.package}</span>
                    Order Items ({detailOrder.items.length})
                  </h3>
                  <table className="ao-items-table">
                    <thead>
                      <tr><th>#</th><th>Product Name</th><th>Quantity</th><th>Price</th><th>Subtotal</th></tr>
                    </thead>
                    <tbody>
                      {detailOrder.items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: 600, color: 'var(--ao-text-primary)' }}>{item.productName}</td>
                          <td>{item.quantity?.toLocaleString()}</td>
                          <td>{formatCurrency(item.price)}</td>
                          <td style={{ fontWeight: 600 }}>{formatCurrency((item.quantity || 0) * (item.price || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}            </div>
            <div className="ao-modal-footer">
              <button className="ao-btn-cancel" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ================================
          CONFIRM ACTION MODAL
          ================================ */}
      {showConfirmModal && (() => {
        const cfg = getConfirmConfig();
        return (
          <div className="ao-modal-overlay" onClick={() => setShowConfirmModal(false)}>
            <div className="ao-modal confirm" onClick={(e) => e.stopPropagation()}>
              <div className="ao-modal-header">
                <div className="ao-modal-header-left">
                  <div className={`ao-modal-icon ${cfg.iconClass}`}>{cfg.icon}</div>
                  <h2 className="ao-modal-title">{cfg.title}</h2>
                </div>
                <button className="ao-modal-close" onClick={() => setShowConfirmModal(false)}>{Icons.close}</button>
              </div>
              <div className="ao-modal-body" style={{ textAlign: 'center' }}>
                <p className="ao-confirm-message">{getConfirmMessage()}</p>
              </div>
              <div className="ao-modal-footer center">
                <button className="ao-btn-cancel" onClick={() => setShowConfirmModal(false)} disabled={actionLoading}>Go Back</button>
                <button className={cfg.btnClass} onClick={executeConfirmAction} disabled={actionLoading}>
                  {actionLoading && <span className="ao-spinner-sm"></span>}
                  {actionLoading ? "Processing..." : cfg.btnText}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AdminOrders;
