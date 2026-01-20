import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import authService from "../../services/authService";
import imsLogo from "../../assets/ims2.jpg";
import "./SalesOrders.css";

const SalesOrders = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = authService.getCurrentUser();

  // Form states for new order
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerName: "",
    productName: "",
    productType: "PCB",
    quantity: "",
    unit: "pcs",
    deadline: "",
    priority: "Medium",
    notes: "",
  });

  // Orders state
  const [orders, setOrders] = useState([
    {
      id: "ORD-001",
      customerName: "ABC Electronics Corp",
      productName: "PCB Board Type A",
      productType: "PCB",
      quantity: 5000,
      unit: "pcs",
      deadline: "2026-02-15",
      priority: "High",
      status: "In Production",
      progress: 65,
      createdAt: "2026-01-10",
      createdBy: "Sales User",
    },
    {
      id: "ORD-002",
      customerName: "XYZ Technology Ltd",
      productName: "LED Module V2",
      productType: "Module",
      quantity: 2000,
      unit: "pcs",
      deadline: "2026-02-20",
      priority: "Medium",
      status: "Confirmed",
      progress: 0,
      createdAt: "2026-01-12",
      createdBy: "Sales User",
    },
    {
      id: "ORD-003",
      customerName: "DEF Manufacturing Inc",
      productName: "Control Board CB-100",
      productType: "PCB",
      quantity: 3000,
      unit: "pcs",
      deadline: "2026-01-25",
      priority: "Urgent",
      status: "In Production",
      progress: 85,
      createdAt: "2026-01-05",
      createdBy: "Sales User",
    },
    {
      id: "ORD-004",
      customerName: "GHI Solutions",
      productName: "Sensor Module SM-50",
      productType: "Module",
      quantity: 1500,
      unit: "pcs",
      deadline: "2026-03-01",
      priority: "Low",
      status: "Draft",
      progress: 0,
      createdAt: "2026-01-18",
      createdBy: "Sales User",
    },
    {
      id: "ORD-005",
      customerName: "JKL Electronics",
      productName: "Power Board PB-200",
      productType: "PCB",
      quantity: 4000,
      unit: "pcs",
      deadline: "2026-01-20",
      priority: "High",
      status: "Completed",
      progress: 100,
      createdAt: "2026-01-02",
      createdBy: "Sales User",
    },
  ]);

  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const handleCreateOrder = (e) => {
    e.preventDefault();
    const order = {
      id: `ORD-${String(orders.length + 1).padStart(3, "0")}`,
      ...newOrder,
      quantity: parseInt(newOrder.quantity),
      status: "Draft",
      progress: 0,
      createdAt: new Date().toISOString().split("T")[0],
      createdBy: currentUser?.fullName || "Sales User",
    };
    setOrders([order, ...orders]);
    setShowCreateModal(false);
    setNewOrder({
      customerName: "",
      productName: "",
      productType: "PCB",
      quantity: "",
      unit: "pcs",
      deadline: "",
      priority: "Medium",
      notes: "",
    });
  };

  const handleStatusChange = (orderId, newStatus) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Draft":
        return "status-draft";
      case "Confirmed":
        return "status-confirmed";
      case "In Production":
        return "status-in-production";
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
      case "Urgent":
        return "priority-urgent";
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

  const isDeadlineNear = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 5 && diffDays >= 0;
  };

  const isOverdue = (deadline, status) => {
    if (status === "Completed") return false;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    return deadlineDate < today;
  };

  const filteredOrders = orders.filter((order) => {
    const matchStatus = filterStatus === "All" || order.status === filterStatus;
    const matchSearch =
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const orderStats = {
    total: orders.length,
    draft: orders.filter((o) => o.status === "Draft").length,
    confirmed: orders.filter((o) => o.status === "Confirmed").length,
    inProduction: orders.filter((o) => o.status === "In Production").length,
    completed: orders.filter((o) => o.status === "Completed").length,
  };

  return (
    <div className="sales-container">
      {/* Sidebar */}
      <aside className="sales-sidebar">
        <div className="sidebar-header">
          <img src={imsLogo} alt="IMS Logo" className="sidebar-logo" />
          <span className="sidebar-title">IMS Sales</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-item active">
            <span className="nav-icon">📦</span>
            <span>Orders</span>
          </div>
          <div
            className="nav-item"
            onClick={() => navigate("/sales/customers")}
          >
            <span className="nav-icon">👥</span>
            <span>Customers</span>
          </div>
          <div className="nav-item" onClick={() => navigate("/sales/products")}>
            <span className="nav-icon">�icing</span>
            <span>Products</span>
          </div>
          <div className="nav-item" onClick={() => navigate("/sales/reports")}>
            <span className="nav-icon">📊</span>
            <span>Reports</span>
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
      <main className="sales-main">
        {/* Header */}
        <header className="sales-header">
          <div className="header-left">
            <h1>Order Management</h1>
            <p>Create and track customer orders</p>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">
                {currentUser?.fullName || "Sales"}
              </span>
              <span className="user-role">Sales</span>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon total">📦</div>
            <div className="stat-content">
              <span className="stat-number">{orderStats.total}</span>
              <span className="stat-label">Total Orders</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon draft">📝</div>
            <div className="stat-content">
              <span className="stat-number">{orderStats.draft}</span>
              <span className="stat-label">Draft</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon confirmed">✓</div>
            <div className="stat-content">
              <span className="stat-number">{orderStats.confirmed}</span>
              <span className="stat-label">Confirmed</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon production">⚙️</div>
            <div className="stat-content">
              <span className="stat-number">{orderStats.inProduction}</span>
              <span className="stat-label">In Production</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon completed">✅</div>
            <div className="stat-content">
              <span className="stat-number">{orderStats.completed}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="orders-toolbar">
          <div className="toolbar-left">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
                <option value="In Production">In Production</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="toolbar-right">
            <button
              className="btn-create"
              onClick={() => setShowCreateModal(true)}
            >
              + Create Order
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="orders-table-container">
          <table className="orders-table">
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
                <tr
                  key={order.id}
                  className={
                    isOverdue(order.deadline, order.status) ? "overdue-row" : ""
                  }
                >
                  <td className="order-id">{order.id}</td>
                  <td>
                    <div className="customer-cell">
                      <span className="customer-name">
                        {order.customerName}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="product-cell">
                      <span className="product-name">{order.productName}</span>
                      <span className="product-type">{order.productType}</span>
                    </div>
                  </td>
                  <td className="quantity-cell">
                    {order.quantity.toLocaleString()} {order.unit}
                  </td>
                  <td>
                    <div
                      className={`deadline-cell ${isDeadlineNear(order.deadline) ? "deadline-near" : ""} ${isOverdue(order.deadline, order.status) ? "deadline-overdue" : ""}`}
                    >
                      <span>{order.deadline}</span>
                      {isOverdue(order.deadline, order.status) && (
                        <span className="overdue-badge">OVERDUE</span>
                      )}
                      {isDeadlineNear(order.deadline) &&
                        !isOverdue(order.deadline, order.status) && (
                          <span className="near-badge">SOON</span>
                        )}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`priority-badge ${getPriorityClass(order.priority)}`}
                    >
                      {order.priority}
                    </span>
                  </td>
                  <td>
                    <select
                      className={`status-select ${getStatusClass(order.status)}`}
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value)
                      }
                    >
                      <option value="Draft">Draft</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="In Production">In Production</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>
                    <div className="progress-cell">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${order.progress}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{order.progress}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action view" title="View Details">
                        👁️
                      </button>
                      <button className="btn-action edit" title="Edit">
                        ✏️
                      </button>
                      <button className="btn-action delete" title="Delete">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New Order</h2>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateOrder} className="order-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={newOrder.customerName}
                    onChange={(e) =>
                      setNewOrder({ ...newOrder, customerName: e.target.value })
                    }
                    placeholder="Enter customer name"
                  />
                </div>
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    required
                    value={newOrder.productName}
                    onChange={(e) =>
                      setNewOrder({ ...newOrder, productName: e.target.value })
                    }
                    placeholder="Enter product name"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Product Type *</label>
                  <select
                    value={newOrder.productType}
                    onChange={(e) =>
                      setNewOrder({ ...newOrder, productType: e.target.value })
                    }
                  >
                    <option value="PCB">PCB Board</option>
                    <option value="Module">Module</option>
                    <option value="Assembly">Assembly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity *</label>
                  <div className="input-group">
                    <input
                      type="number"
                      required
                      min="1"
                      value={newOrder.quantity}
                      onChange={(e) =>
                        setNewOrder({ ...newOrder, quantity: e.target.value })
                      }
                      placeholder="Enter quantity"
                    />
                    <select
                      value={newOrder.unit}
                      onChange={(e) =>
                        setNewOrder({ ...newOrder, unit: e.target.value })
                      }
                    >
                      <option value="pcs">pcs</option>
                      <option value="sets">sets</option>
                      <option value="units">units</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Deadline *</label>
                  <input
                    type="date"
                    required
                    value={newOrder.deadline}
                    onChange={(e) =>
                      setNewOrder({ ...newOrder, deadline: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Priority *</label>
                  <select
                    value={newOrder.priority}
                    onChange={(e) =>
                      setNewOrder({ ...newOrder, priority: e.target.value })
                    }
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="form-group full-width">
                <label>Notes</label>
                <textarea
                  value={newOrder.notes}
                  onChange={(e) =>
                    setNewOrder({ ...newOrder, notes: e.target.value })
                  }
                  placeholder="Additional notes..."
                  rows="3"
                ></textarea>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesOrders;
