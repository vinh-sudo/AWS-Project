import React, { useState, useEffect } from "react";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import ManagerTopBar from "./ManagerTopBar";
import managerService from "../../services/managerService";
import authService from "../../services/authService";
import PageLoading from "../../components/PageLoading/PageLoading";
import "./ManagerOrders.css";

const Icon = ({ name, className = "mo-icon" }) => {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  switch (name) {
    case "package":
      return (
        <svg {...common}>
          <path d="m7.5 4.27 9 5.15" />
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.29 7 8.71 5 8.71-5" />
          <path d="M12 22V12" />
        </svg>
      );
    case "refresh":
      return (
        <svg {...common}>
          <path d="M21 2v6h-6" />
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          <path d="M3 22v-6h6" />
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        </svg>
      );
    case "clipboard":
      return (
        <svg {...common}>
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" />
        </svg>
      );
    case "draft":
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    case "factory":
      return (
        <svg {...common}>
          <path d="M3 21h18" />
          <path d="M5 21V9l6 3V9l6 3v9" />
          <path d="M9 21v-4" />
          <path d="M13 21v-4" />
        </svg>
      );
    case "spark":
      return (
        <svg {...common}>
          <path d="m12 3 1.9 3.9L18 9l-4.1 2.1L12 15l-1.9-3.9L6 9l4.1-2.1Z" />
          <path d="M5 3v4" />
          <path d="M3 5h4" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      );
    case "warning":
      return (
        <svg {...common}>
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "inbox":
      return (
        <svg {...common}>
          <path d="M22 12h-6l-2 3h-4l-2-3H2" />
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
        </svg>
      );
    case "eye":
      return (
        <svg {...common}>
          <path d="M2.06 12a10.94 10.94 0 0 1 19.88 0 10.94 10.94 0 0 1-19.88 0" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "paperclip":
      return (
        <svg {...common}>
          <path d="m21.44 11.05-8.49 8.49a5 5 0 0 1-7.07-7.07l8.49-8.49a3 3 0 1 1 4.24 4.24l-8.5 8.49a1 1 0 1 1-1.41-1.41l7.78-7.78" />
        </svg>
      );
    default:
      return null;
  }
};

const ManagerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [orderFiles, setOrderFiles] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "desc",
  });
  const [activeTab, setActiveTab] = useState("details");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilterChips, setActiveFilterChips] = useState([]);

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

  const normalizeOrderStatus = (status) => {
    const normalized = (status || "").toString().trim().toUpperCase();

    switch (normalized) {
      case "DRAFT":
        return "DRAFT";
      case "CONFIRMED":
        return "CONFIRMED";
      case "PLANNING":
        return "PLANNING";
      case "SCHEDULED":
        return "SCHEDULED";
      case "IN PRODUCTION":
      case "IN_PRODUCTION":
        return "IN_PRODUCTION";
      case "COMPLETED":
        return "COMPLETED";
      case "CANCELLED":
        return "CANCELLED";
      case "STOPPED":
        return "STOPPED";
      case "NEW":
        return "NEW";
      default:
        return "UNKNOWN";
    }
  };

  const getStatusClass = (status) => {
    switch (normalizeOrderStatus(status)) {
      case "DRAFT":
        return "mo-status-draft";
      case "CONFIRMED":
        return "mo-status-confirmed";
      case "PLANNING":
      case "SCHEDULED":
      case "NEW":
        return "mo-status-planning";
      case "IN_PRODUCTION":
        return "mo-status-production";
      case "COMPLETED":
        return "mo-status-completed";
      case "CANCELLED":
        return "mo-status-cancelled";
      case "STOPPED":
        return "mo-status-stopped";
      default:
        return "";
    }
  };

  const getStatusDisplay = (status) => {
    switch (normalizeOrderStatus(status)) {
      case "DRAFT":
        return "Draft";
      case "CONFIRMED":
        return "Confirmed";
      case "PLANNING":
        return "Planning";
      case "SCHEDULED":
        return "Scheduled";
      case "IN_PRODUCTION":
        return "In Production";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      case "STOPPED":
        return "Stopped";
      case "NEW":
        return "New";
      default:
        return status || "Unknown";
    }
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
        statusFilter === "ALL" ||
        normalizeOrderStatus(order.status) === statusFilter;
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
    pending: orders.filter((o) =>
      ["DRAFT", "CONFIRMED", "NEW"].includes(normalizeOrderStatus(o.status)),
    ).length,
    planningScheduled: orders.filter((o) =>
      ["PLANNING", "SCHEDULED"].includes(normalizeOrderStatus(o.status)),
    ).length,
    inProduction: orders.filter(
      (o) => normalizeOrderStatus(o.status) === "IN_PRODUCTION",
    ).length,
    completed: orders.filter(
      (o) => normalizeOrderStatus(o.status) === "COMPLETED",
    ).length,
    blocked: orders.filter((o) =>
      ["STOPPED", "CANCELLED"].includes(normalizeOrderStatus(o.status)),
    ).length,
  };

  const handleViewDetail = async (orderId) => {
    try {
      setDetailLoading(true);
      const detail = await managerService.getOrderById(orderId);
      setDetailOrder(detail);

      try {
        const files = await managerService.getOrderFiles(orderId);
        setOrderFiles(Array.isArray(files) ? files : []);
      } catch (fileError) {
        console.error("Error loading order files:", fileError);
        setOrderFiles([]);
      }

      setShowDetailModal(true);
    } catch (err) {
      console.error("Error loading order detail:", err);
      setError(err.response?.data?.message || "Failed to load order detail");
    } finally {
      setDetailLoading(false);
    }
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
              <h1>
                <Icon name="package" className="mo-icon mo-icon-lg" />
                <span>Order Management</span>
              </h1>
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
                <Icon name="refresh" className="mo-icon mo-icon-sm" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mo-stats-row">
            <div className="mo-stat-card">
              <div className="mo-stat-icon">
                <Icon name="clipboard" />
              </div>
              <div className="mo-stat-info">
                <span className="mo-stat-number">{stats.total}</span>
                <span className="mo-stat-label">Total</span>
              </div>
            </div>
            <div className="mo-stat-card mo-stat-draft">
              <div className="mo-stat-icon">
                <Icon name="draft" />
              </div>
              <div className="mo-stat-info">
                <span className="mo-stat-number">{stats.pending}</span>
                <span className="mo-stat-label">Pending</span>
              </div>
            </div>
            <div className="mo-stat-card mo-stat-production">
              <div className="mo-stat-icon">
                <Icon name="factory" />
              </div>
              <div className="mo-stat-info">
                <span className="mo-stat-number">
                  {stats.planningScheduled}
                </span>
                <span className="mo-stat-label">Planning/Scheduled</span>
              </div>
            </div>
            <div className="mo-stat-card mo-stat-production">
              <div className="mo-stat-icon">
                <Icon name="factory" />
              </div>
              <div className="mo-stat-info">
                <span className="mo-stat-number">{stats.inProduction}</span>
                <span className="mo-stat-label">In Production</span>
              </div>
            </div>
            <div className="mo-stat-card mo-stat-completed">
              <div className="mo-stat-icon">
                <Icon name="spark" />
              </div>
              <div className="mo-stat-info">
                <span className="mo-stat-number">{stats.completed}</span>
                <span className="mo-stat-label">Completed</span>
              </div>
            </div>
            <div className="mo-stat-card mo-stat-cancelled">
              <div className="mo-stat-icon">
                <Icon name="x" />
              </div>
              <div className="mo-stat-info">
                <span className="mo-stat-number">{stats.blocked}</span>
                <span className="mo-stat-label">Stopped/Cancelled</span>
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
                <option value="ALL">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PLANNING">Planning</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PRODUCTION">In Production</option>
                <option value="STOPPED">Stopped</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="NEW">New</option>
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
            <button 
              className={`mo-filter-toggle ${showAdvancedFilters ? 'mo-filter-open' : ''}`}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              title="Advanced Filters"
            >
              ⚙️ Advanced
            </button>
            <div className="mo-filter-summary">
              Showing <strong>{filteredOrders.length}</strong> of{" "}
              {orders.length} orders
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeFilterChips.length > 0 && (
            <div className="mo-advanced-filters">
              <div className="mo-active-filters">
                {activeFilterChips.map((chip, idx) => (
                  <span key={idx} className="mo-filter-chip">
                    {chip}
                    <button 
                      className="mo-filter-chip-close" 
                      onClick={() => {
                        setActiveFilterChips(activeFilterChips.filter((_, i) => i !== idx));
                      }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
                <button 
                  className="mo-filter-chip-clear-all"
                  onClick={() => setActiveFilterChips([])}
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <PageLoading variant="inline" text="Loading orders..." />
          ) : error ? (
            <div className="mo-error">
              <span className="mo-error-icon">
                <Icon name="warning" className="mo-icon mo-icon-lg" />
              </span>
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
                        <span className="mo-empty-icon">
                          <Icon name="inbox" className="mo-icon mo-icon-md" />
                        </span>
                        <span>No orders found</span>
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
                            onClick={() => handleViewDetail(order.id)}
                            title="View Detail"
                          >
                            <Icon name="eye" className="mo-icon mo-icon-sm" />
                            <span>View</span>
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
              <h2>
                <Icon name="clipboard" className="mo-icon mo-icon-md" />
                <span>Order #{detailOrder.id}</span>
              </h2>
              <button
                className="mo-modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                <Icon name="x" className="mo-icon mo-icon-sm" />
              </button>
            </div>
            
            {/* Modal Tabs */}
            <div className="mo-modal-tabs">
              <button 
                className={`mo-tab-btn ${activeTab === 'details' ? 'mo-tab-active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
              <button 
                className={`mo-tab-btn ${activeTab === 'items' ? 'mo-tab-active' : ''}`}
                onClick={() => setActiveTab('items')}
              >
                Items
              </button>
              <button 
                className={`mo-tab-btn ${activeTab === 'files' ? 'mo-tab-active' : ''}`}
                onClick={() => setActiveTab('files')}
              >
                Files
              </button>
            </div>
            
            <div className="mo-modal-body">
              {detailLoading ? (
                <PageLoading variant="inline" text="Loading order detail..." />
              ) : (
                <>
                  {/* Details Tab */}
                  <div className={`mo-tab-content ${activeTab === 'details' ? 'mo-tab-content-active' : ''}`}>
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
                  </div>

                  {/* Items Tab */}
                  <div className={`mo-tab-content ${activeTab === 'items' ? 'mo-tab-content-active' : ''}`}>
                    {detailOrder.items && detailOrder.items.length > 0 ? (
                      <div className="mo-detail-items">
                        <h3>
                          <Icon name="package" className="mo-icon mo-icon-sm" />
                          <span>Order Items ({detailOrder.items.length})</span>
                        </h3>
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
                    ) : (
                      <div className="mo-empty-state">
                        <p>No items in this order</p>
                      </div>
                    )}
                  </div>

                  {/* Files Tab */}
                  <div className={`mo-tab-content ${activeTab === 'files' ? 'mo-tab-content-active' : ''}`}>
                    <div className="mo-detail-items">
                      <h3>
                        <Icon name="paperclip" className="mo-icon mo-icon-sm" />
                        <span>Files ({orderFiles.length})</span>
                      </h3>
                      {orderFiles.length > 0 ? (
                        <div className="mo-file-list">
                          {orderFiles.map((file, idx) => (
                            <a
                              key={file.id || idx}
                              href={file.url}
                              className="mo-file-item"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span className="mo-file-name">
                                {file.fileName || "Unnamed file"}
                              </span>
                              <span className="mo-file-meta">
                                {file.uploadedAt
                                  ? new Date(file.uploadedAt).toLocaleString(
                                      "en-US",
                                    )
                                  : "Uploaded time unavailable"}
                              </span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="mo-file-empty">
                          No files attached to this order.
                        </p>
                      )}
                    </div>
                  </div>
                </>
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
