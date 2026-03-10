import React, { useState, useEffect } from "react";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import ManagerTopBar from "./ManagerTopBar";
import managerService from "../../services/managerService";
import authService from "../../services/authService";
import "./ManagerOrders.css";

const ManagerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "desc",
  });

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await managerService.getAllOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US");
  };

  const formatCurrency = (value) => {
    if (value == null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Draft":
        return "mo-status-draft";
      case "Confirmed":
        return "mo-status-confirmed";
      case "In Production":
        return "mo-status-production";
      case "Completed":
        return "mo-status-completed";
      case "Cancelled":
        return "mo-status-cancelled";
      case "STOPPED":
        return "mo-status-stopped";
      default:
        return "";
    }
  };

  const getStatusDisplay = (status) => {
    if (status === "STOPPED") return "Stopped";
    return status || "Unknown";
  };

  const getPriorityClass = (priority) => {
    switch (priority?.toUpperCase()) {
      case "URGENT":
      case "CRITICAL":
        return "mo-priority-critical";
      case "HIGH":
        return "mo-priority-high";
      case "MEDIUM":
        return "mo-priority-medium";
      case "LOW":
        return "mo-priority-low";
      default:
        return "";
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const filteredOrders = orders
    .filter((order) => {
      const matchSearch =
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.productType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id?.toString().includes(searchTerm);
      const matchStatus =
        statusFilter === "All" || order.status === statusFilter;
      const matchPriority =
        priorityFilter === "All" ||
        order.priority?.toUpperCase() === priorityFilter.toUpperCase();
      return matchSearch && matchStatus && matchPriority;
    })
    .sort((a, b) => {
      const { key, direction } = sortConfig;
      let aVal = a[key];
      let bVal = b[key];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });

  const stats = {
    total: orders.length,
    draft: orders.filter((o) => o.status === "Draft").length,
    confirmed: orders.filter((o) => o.status === "Confirmed").length,
    inProduction: orders.filter((o) => o.status === "In Production").length,
    completed: orders.filter((o) => o.status === "Completed").length,
    stopped: orders.filter((o) => o.status === "STOPPED").length,
    cancelled: orders.filter((o) => o.status === "Cancelled").length,
  };

  const handleViewDetail = (order) => {
    setDetailOrder(order);
    setShowDetailModal(true);
  };

  return (
    <div className="manager-container">
      <ManagerSidebar />

      <main className="manager-main">
        <ManagerTopBar
          searchPlaceholder="Search orders..."
          onSearch={(term) => setSearchTerm(term)}
        />

        <div className="page-content">
          <div className="page-title-row">
            <div className="page-title-left">
              <h1>📦 Order Management</h1>
              <p className="page-subtitle">
                Monitor and track all production orders
              </p>
            </div>
            <div className="page-title-right">
              <button
                className="mo-refresh-btn"
                onClick={fetchOrders}
                title="Refresh"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mo-stats-row">
            <div className="mo-stat-card">
              <div className="mo-stat-icon">📋</div>
              <div className="mo-stat-info">
                <span className="mo-stat-number">{stats.total}</span>
                <span className="mo-stat-label">Total</span>
              </div>
            </div>
            <div className="mo-stat-card mo-stat-draft">
              <div className="mo-stat-icon">📝</div>
              <div className="mo-stat-info">
                <span className="mo-stat-number">{stats.draft}</span>
                <span className="mo-stat-label">Draft</span>
              </div>
            </div>
            <div className="mo-stat-card mo-stat-confirmed">
              <div className="mo-stat-icon">✅</div>
              <div className="mo-stat-info">
                <span className="mo-stat-number">{stats.confirmed}</span>
                <span className="mo-stat-label">Confirmed</span>
              </div>
            </div>
            <div className="mo-stat-card mo-stat-production">
              <div className="mo-stat-icon">🏭</div>
              <div className="mo-stat-info">
                <span className="mo-stat-number">{stats.inProduction}</span>
                <span className="mo-stat-label">In Production</span>
              </div>
            </div>
            <div className="mo-stat-card mo-stat-completed">
              <div className="mo-stat-icon">🎉</div>
              <div className="mo-stat-info">
                <span className="mo-stat-number">{stats.completed}</span>
                <span className="mo-stat-label">Completed</span>
              </div>
            </div>
            <div className="mo-stat-card mo-stat-cancelled">
              <div className="mo-stat-icon">❌</div>
              <div className="mo-stat-info">
                <span className="mo-stat-number">
                  {stats.cancelled + stats.stopped}
                </span>
                <span className="mo-stat-label">Cancelled/Stopped</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mo-filters-row">
            <div className="mo-filter-group">
              <label>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
                <option value="In Production">In Production</option>
                <option value="STOPPED">Stopped</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="mo-filter-group">
              <label>Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="All">All Priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div className="mo-filter-summary">
              Showing <strong>{filteredOrders.length}</strong> of{" "}
              {orders.length} orders
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="mo-loading">
              <div className="mo-loading-spinner"></div>
              <p>Loading orders...</p>
            </div>
          ) : error ? (
            <div className="mo-error">
              <span className="mo-error-icon">⚠️</span>
              <p>{error}</p>
              <button onClick={fetchOrders}>Retry</button>
            </div>
          ) : (
            <div className="mo-table-container">
              <table className="mo-table">
                <thead>
                  <tr>
                    <th
                      onClick={() => handleSort("id")}
                      className="mo-sortable"
                    >
                      ID {getSortIcon("id")}
                    </th>
                    <th
                      onClick={() => handleSort("customerName")}
                      className="mo-sortable"
                    >
                      Customer {getSortIcon("customerName")}
                    </th>
                    <th
                      onClick={() => handleSort("productType")}
                      className="mo-sortable"
                    >
                      Product {getSortIcon("productType")}
                    </th>
                    <th
                      onClick={() => handleSort("quantity")}
                      className="mo-sortable"
                    >
                      Qty {getSortIcon("quantity")}
                    </th>
                    <th
                      onClick={() => handleSort("deadline")}
                      className="mo-sortable"
                    >
                      Deadline {getSortIcon("deadline")}
                    </th>
                    <th
                      onClick={() => handleSort("priority")}
                      className="mo-sortable"
                    >
                      Priority {getSortIcon("priority")}
                    </th>
                    <th
                      onClick={() => handleSort("status")}
                      className="mo-sortable"
                    >
                      Status {getSortIcon("status")}
                    </th>
                    <th>Created By</th>
                    <th
                      onClick={() => handleSort("totalPrice")}
                      className="mo-sortable"
                    >
                      Total {getSortIcon("totalPrice")}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="mo-empty-row">
                        <span>📭</span> No orders found
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="mo-id">#{order.id}</td>
                        <td className="mo-customer">{order.customerName}</td>
                        <td>{order.productType}</td>
                        <td className="mo-qty">
                          {order.quantity?.toLocaleString()}
                        </td>
                        <td>{formatDate(order.deadline)}</td>
                        <td>
                          <span
                            className={`mo-priority-badge ${getPriorityClass(order.priority)}`}
                          >
                            {order.priority}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`mo-status-badge ${getStatusClass(order.status)}`}
                          >
                            {getStatusDisplay(order.status)}
                          </span>
                        </td>
                        <td>{order.createdByName || "—"}</td>
                        <td className="mo-price">
                          {formatCurrency(order.totalPrice)}
                        </td>
                        <td>
                          <button
                            className="mo-btn-view"
                            onClick={() => handleViewDetail(order)}
                            title="View Detail"
                          >
                            👁️ View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {showDetailModal && detailOrder && (
        <div
          className="mo-modal-overlay"
          onClick={() => setShowDetailModal(false)}
        >
          <div className="mo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mo-modal-header">
              <h2>📋 Order #{detailOrder.id}</h2>
              <button
                className="mo-modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="mo-modal-body">
              <div className="mo-detail-grid">
                <div className="mo-detail-item">
                  <span className="mo-detail-label">Customer</span>
                  <span className="mo-detail-value">
                    {detailOrder.customerName}
                  </span>
                </div>
                <div className="mo-detail-item">
                  <span className="mo-detail-label">Product Type</span>
                  <span className="mo-detail-value">
                    {detailOrder.productType}
                  </span>
                </div>
                <div className="mo-detail-item">
                  <span className="mo-detail-label">Quantity</span>
                  <span className="mo-detail-value">
                    {detailOrder.quantity?.toLocaleString()}
                  </span>
                </div>
                <div className="mo-detail-item">
                  <span className="mo-detail-label">Deadline</span>
                  <span className="mo-detail-value">
                    {formatDate(detailOrder.deadline)}
                  </span>
                </div>
                <div className="mo-detail-item">
                  <span className="mo-detail-label">Priority</span>
                  <span
                    className={`mo-priority-badge ${getPriorityClass(detailOrder.priority)}`}
                  >
                    {detailOrder.priority}
                  </span>
                </div>
                <div className="mo-detail-item">
                  <span className="mo-detail-label">Status</span>
                  <span
                    className={`mo-status-badge ${getStatusClass(detailOrder.status)}`}
                  >
                    {getStatusDisplay(detailOrder.status)}
                  </span>
                </div>
                <div className="mo-detail-item">
                  <span className="mo-detail-label">Created By</span>
                  <span className="mo-detail-value">
                    {detailOrder.createdByName || "—"}
                  </span>
                </div>
                <div className="mo-detail-item">
                  <span className="mo-detail-label">Total Price</span>
                  <span className="mo-detail-value">
                    {formatCurrency(detailOrder.totalPrice)}
                  </span>
                </div>
                <div className="mo-detail-item">
                  <span className="mo-detail-label">Created</span>
                  <span className="mo-detail-value">
                    {formatDate(detailOrder.createdAt)}
                  </span>
                </div>
                <div className="mo-detail-item">
                  <span className="mo-detail-label">Updated</span>
                  <span className="mo-detail-value">
                    {formatDate(detailOrder.updatedAt)}
                  </span>
                </div>
              </div>

              {detailOrder.items && detailOrder.items.length > 0 && (
                <div className="mo-detail-items">
                  <h3>📦 Order Items ({detailOrder.items.length})</h3>
                  <table className="mo-items-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Product Name</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailOrder.items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td>{idx + 1}</td>
                          <td>{item.productName}</td>
                          <td>{item.quantity?.toLocaleString()}</td>
                          <td>{formatCurrency(item.price)}</td>
                          <td>
                            {formatCurrency(
                              (item.quantity || 0) * (item.price || 0),
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="mo-modal-footer">
              <button
                className="mo-btn-close"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerOrders;
