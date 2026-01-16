import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import imsLogo from "../../assets/ims2.jpg";
import "./ManagerOrders.css";

const ManagerOrders = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  // Filter states
  const [statusFilter, setStatusFilter] = useState("");
  const [deadlineFilter, setDeadlineFilter] = useState("");
  const [lineFilter, setLineFilter] = useState("");

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customer: "",
    product: "",
    deadline: "",
    productionLine: "",
  });

  // Mock orders data
  const [orders] = useState([
    {
      id: "ORD-001",
      customer: "ABC Corp",
      product: "Widget A",
      deadline: "Jan 30, 2026",
      status: "Closed",
      line: "Line A",
    },
    {
      id: "ORD-002",
      customer: "XYZ Ltd",
      product: "Widget B",
      deadline: "Feb 15, 2026",
      status: "Short",
      line: "Line B",
    },
    {
      id: "ORD-003",
      customer: "DEF Inc",
      product: "Widget C",
      deadline: "Feb 20, 2026",
      status: "Client",
      line: "Line D",
    },
    {
      id: "ORD-004",
      customer: "GHI Company",
      product: "Widget D",
      deadline: "Jan 25, 2026",
      status: "Huy",
      line: "Line A",
    },
    {
      id: "ORD-005",
      customer: "JKL Corp",
      product: "Widget E",
      deadline: "Feb 05, 2026",
      status: "Flavo",
      line: "Line E",
    },
    {
      id: "ORD-006",
      customer: "MNO Industries",
      product: "Widget F",
      deadline: "Feb 10, 2026",
      status: "Closed",
      line: "Line C",
    },
    {
      id: "ORD-007",
      customer: "PQR Solutions",
      product: "Widget G",
      deadline: "Feb 25, 2026",
      status: "Short",
      line: "Line B",
    },
  ]);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Closed":
        return "status-closed";
      case "Short":
        return "status-short";
      case "Client":
        return "status-client";
      case "Huy":
        return "status-huy";
      case "Flavo":
        return "status-flavo";
      default:
        return "";
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (statusFilter && order.status !== statusFilter) return false;
    if (lineFilter && order.line !== lineFilter) return false;
    return true;
  });

  const handleCreateOrder = (e) => {
    e.preventDefault();
    console.log("Creating new order:", newOrder);
    setShowCreateModal(false);
    setNewOrder({
      customer: "",
      product: "",
      deadline: "",
      productionLine: "",
    });
  };

  return (
    <div className="manager-container">
      {/* Sidebar */}
      <div className="manager-sidebar">
        <div className="sidebar-header">
          <img src={imsLogo} alt="Logo" className="sidebar-logo" />
          <div className="sidebar-title">IMS Manager</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item" onClick={() => navigate("/manager/dashboard")}>
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </div>
          <div className="nav-item active">
            <span className="nav-icon">📦</span>
            <span>Orders</span>
          </div>
          <div className="nav-item" onClick={() => navigate("/manager/scheduling")}>
            <span className="nav-icon">📅</span>
            <span>Scheduling</span>
          </div>
          <div className="nav-item">
            <span className="nav-icon">🏭</span>
            <span>Production Lines</span>
          </div>
          <div className="nav-item">
            <span className="nav-icon">📈</span>
            <span>Reports</span>
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
      <div className="manager-main">
        {/* Header */}
        <header className="manager-header">
          <div className="header-left">
            <span className="header-badge">Manager</span>
          </div>
          <div className="header-actions">
            <button className="header-icon-btn">🔔</button>
            <button className="header-icon-btn">⚙️</button>
            <button className="header-icon-btn notification-badge">💬</button>
            <button className="header-icon-btn">✓</button>
            <div className="user-menu">
              <div className="user-avatar"></div>
            </div>
          </div>
        </header>

        {/* Page Title */}
        <div className="page-title-section">
          <h1 className="page-title">Order Management</h1>
        </div>

        {/* Orders Content */}
        <div className="manager-content">
          {/* Create Order Button */}
          <div className="action-bar">
            <button 
              className="create-order-btn"
              onClick={() => setShowCreateModal(true)}
            >
              Create New Order ▼
            </button>
          </div>

          {/* Filters */}
          <div className="filter-section">
            <div className="filter-label">Filter</div>
            <div className="filter-controls">
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Status</option>
                <option value="Closed">Closed</option>
                <option value="Short">Short</option>
                <option value="Client">Client</option>
                <option value="Huy">Huy</option>
                <option value="Flavo">Flavo</option>
              </select>

              <select
                className="filter-select"
                value={deadlineFilter}
                onChange={(e) => setDeadlineFilter(e.target.value)}
              >
                <option value="">Deadline</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
                <option value="next-month">Next Month</option>
              </select>

              <select
                className="filter-select"
                value={lineFilter}
                onChange={(e) => setLineFilter(e.target.value)}
              >
                <option value="">Production Line</option>
                <option value="Line A">Line A</option>
                <option value="Line B">Line B</option>
                <option value="Line C">Line C</option>
                <option value="Line D">Line D</option>
                <option value="Line E">Line E</option>
              </select>
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
                  <th>Deadline</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="order-id-cell">{order.id}</td>
                    <td>{order.customer}</td>
                    <td>{order.product}</td>
                    <td>{order.deadline}</td>
                    <td>
                      <span className={`order-status-badge ${getStatusClass(order.status)}`}>
                        {order.status}
                      </span>
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
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Order</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleCreateOrder}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Customer</label>
                  <input
                    type="text"
                    value={newOrder.customer}
                    onChange={(e) => setNewOrder({...newOrder, customer: e.target.value})}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Product</label>
                  <input
                    type="text"
                    value={newOrder.product}
                    onChange={(e) => setNewOrder({...newOrder, product: e.target.value})}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Deadline</label>
                  <input
                    type="date"
                    value={newOrder.deadline}
                    onChange={(e) => setNewOrder({...newOrder, deadline: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Production Line</label>
                  <select
                    value={newOrder.productionLine}
                    onChange={(e) => setNewOrder({...newOrder, productionLine: e.target.value})}
                    required
                  >
                    <option value="">Select Line</option>
                    <option value="Line A">Line A</option>
                    <option value="Line B">Line B</option>
                    <option value="Line C">Line C</option>
                    <option value="Line D">Line D</option>
                    <option value="Line E">Line E</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-create">
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

export default ManagerOrders;
