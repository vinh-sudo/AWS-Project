import React, { useState, useEffect } from "react";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import managerService from "../../services/managerService";
import "./ManagerPlanning.css";

const ManagerPlanning = () => {
  const [plans, setPlans] = useState([]);
  const [orders, setOrders] = useState([]);
  const [linesOverview, setLinesOverview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");

  // Form state for creating plan
  const [planForm, setPlanForm] = useState({
    orderId: "",
    startDate: "",
    note: "",
    lines: [],
  });

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [plansRes, linesRes] = await Promise.all([
        managerService.getAllPlans(filterStatus || null),
        managerService.getLinesOverview(),
      ]);

      setPlans(plansRes || []);
      setOrders(await managerService.getOrders());
      setLinesOverview(linesRes || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Unable to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = (order) => {
    setSelectedOrder(order);
    setPlanForm({
      orderId: order.id,
      startDate: new Date().toISOString().split("T")[0],
      note: "",
      lines: linesOverview.map((line) => ({
        lineId: line.lineId,
        lineName: line.lineName,
        plannedQty: 0,
      })),
    });
    setShowCreateModal(true);
  };

  const handleLineQtyChange = (lineId, qty) => {
    setPlanForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.lineId === lineId
          ? { ...line, plannedQty: parseInt(qty) || 0 }
          : line,
      ),
    }));
  };

  const handleCreatePlan = async () => {
    try {
      const request = {
        orderId: planForm.orderId,
        startDate: planForm.startDate,
        note: planForm.note,
        lines: planForm.lines
          .filter((l) => l.plannedQty > 0)
          .map((l) => ({
            lineId: l.lineId,
            plannedQty: l.plannedQty,
          })),
      };

      await managerService.createPlan(request);
      alert("Plan created successfully!");
      setShowCreateModal(false);
      fetchData();
    } catch (error) {
      console.error("Error creating plan:", error);
      alert(
        "Error creating plan: " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  const handleConfirmPlan = async (orderId) => {
    if (!window.confirm("Are you sure you want to confirm this plan?")) return;

    try {
      const result = await managerService.confirmPlan(orderId);
      if (result.ok) {
        alert("Plan confirmed successfully!");
        fetchData();
      } else {
        alert("Unable to confirm plan:\n" + result.message);
      }
    } catch (error) {
      console.error("Error confirming plan:", error);
      const errorData = error.response?.data;
      if (errorData && errorData.message) {
        alert("Unable to confirm plan:\n" + errorData.message);
      } else {
        alert(
          "Error confirming plan: " +
            (error.response?.data?.message || error.message),
        );
      }
    }
  };

  const handleCancelPlan = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this plan?")) return;

    try {
      await managerService.cancelPlan(orderId);
      alert("Plan cancelled successfully!");
      fetchData();
    } catch (error) {
      console.error("Error cancelling plan:", error);
      alert(
        "Error cancelling plan: " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  const getDecisionClass = (decision) => {
    switch (decision?.toUpperCase()) {
      case "CONFIRMED":
        return "decision-confirmed";
      case "PENDING":
      case "DRAFT":
        return "decision-pending";
      case "CANCELLED":
        return "decision-cancelled";
      default:
        return "";
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority?.toUpperCase()) {
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

  const plansByOrder = plans.reduce((acc, plan) => {
    const orderId = plan.orderId || plan.order?.id;
    if (!acc[orderId]) {
      acc[orderId] = [];
    }
    acc[orderId].push(plan);
    return acc;
  }, {});

  const totalPlanned = planForm.lines.reduce((sum, l) => sum + l.plannedQty, 0);

  const totalOrders = orders.filter(
    (o) => o.status === "APPROVED" || o.status === "NEW",
  ).length;
  const totalPlanGroups = Object.keys(plansByOrder).length;
  const confirmedPlans = plans.filter(
    (p) => p.decision === "CONFIRMED",
  ).length;
  const pendingPlans = plans.filter(
    (p) => p.decision === "DRAFT" || p.decision === "PENDING",
  ).length;

  return (
    <div className="manager-container">
      <ManagerSidebar />

      <main className="manager-main">
        <div className="page-content">
          {/* ── Header Bar ── */}
          <div className="pp-header">
            <div className="pp-header-left">
              <h1>Production Planning</h1>
              <p>Allocate orders to production lines</p>
            </div>
            <div className="pp-header-actions">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pp-select"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <button className="pp-btn-refresh" onClick={fetchData}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                Refresh
              </button>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="error-banner">
              <span>⚠️</span>
              <span>{error}</span>
              <button onClick={fetchData}>Retry</button>
            </div>
          )}

          {/* ── Mini Summary Strip ── */}
          <div className="pp-summary-strip">
            <div className="pp-stat">
              <span className="pp-stat-dot blue"></span>
              <span className="pp-stat-label">Awaiting</span>
              <span className="pp-stat-value">{totalOrders}</span>
            </div>
            <div className="pp-stat-divider" />
            <div className="pp-stat">
              <span className="pp-stat-dot purple"></span>
              <span className="pp-stat-label">Plans</span>
              <span className="pp-stat-value">{totalPlanGroups}</span>
            </div>
            <div className="pp-stat-divider" />
            <div className="pp-stat">
              <span className="pp-stat-dot orange"></span>
              <span className="pp-stat-label">Pending</span>
              <span className="pp-stat-value">{pendingPlans}</span>
            </div>
            <div className="pp-stat-divider" />
            <div className="pp-stat">
              <span className="pp-stat-dot green"></span>
              <span className="pp-stat-label">Confirmed</span>
              <span className="pp-stat-value">{confirmedPlans}</span>
            </div>
          </div>

          {/* ── Main Workspace ── */}
          <div className="pp-workspace">
            {/* Left: Orders Table */}
            <section className="pp-panel pp-orders">
              <div className="pp-panel-header">
                <h2>📦 Orders Awaiting Planning</h2>
                <span className="pp-badge">{totalOrders}</span>
              </div>

              {loading ? (
                <div className="pp-loading">
                  <div className="spinner"></div>
                  <span>Loading orders...</span>
                </div>
              ) : orders.filter(
                  (o) => o.status === "APPROVED" || o.status === "NEW",
                ).length === 0 ? (
                <div className="pp-empty">
                  <span>📭</span>
                  <span>No orders awaiting planning</span>
                </div>
              ) : (
                <div className="pp-table-wrap">
                  <table className="pp-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Priority</th>
                        <th>Deadline</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders
                        .filter(
                          (o) => o.status === "APPROVED" || o.status === "NEW",
                        )
                        .map((order) => (
                          <tr key={order.id}>
                            <td className="pp-cell-id">#{order.id}</td>
                            <td>{order.customerName}</td>
                            <td className="pp-cell-muted">{order.productType}</td>
                            <td className="pp-cell-num">
                              {(order.quantity || 0).toLocaleString()}
                            </td>
                            <td>
                              <span
                                className={`pp-priority ${getPriorityClass(order.priority)}`}
                              >
                                {order.priority}
                              </span>
                            </td>
                            <td className="pp-cell-muted">{order.deadline}</td>
                            <td>
                              <button
                                className="pp-btn-plan"
                                onClick={() => openCreateModal(order)}
                                disabled={linesOverview.length === 0}
                              >
                                + Plan
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Right: Line Capacity Panel */}
            <aside className="pp-panel pp-lines">
              <div className="pp-panel-header">
                <h2>🏭 Line Capacity</h2>
                <span className="pp-badge">{linesOverview.length}</span>
              </div>

              {loading ? (
                <div className="pp-loading">
                  <div className="spinner"></div>
                  <span>Loading...</span>
                </div>
              ) : linesOverview.length === 0 ? (
                <div className="pp-empty">
                  <span>🏭</span>
                  <span>No lines available</span>
                </div>
              ) : (
                <div className="pp-line-list">
                  {linesOverview.map((line) => (
                    <div key={line.lineId} className="pp-line-item">
                      <div className="pp-line-top">
                        <span className="pp-line-name">{line.lineName}</span>
                        <span
                          className={`pp-line-status ${
                            line.status?.toLowerCase() === "running"
                              ? "st-running"
                              : line.status?.toLowerCase() === "idle"
                                ? "st-idle"
                                : "st-off"
                          }`}
                        >
                          {line.status || "N/A"}
                        </span>
                      </div>
                      {line.capacity && (
                        <div className="pp-line-cap">
                          <div className="pp-cap-bar">
                            <div
                              className="pp-cap-fill"
                              style={{
                                width: `${Math.min(((line.busyHours || 0) / (line.availableHours || 8)) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="pp-cap-text">
                            {line.capacity} cap
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </div>

          {/* ── Plans Table (full-width below) ── */}
          <section className="pp-panel pp-plans">
            <div className="pp-panel-header">
              <h2>📊 Production Plans</h2>
              <span className="pp-badge">{totalPlanGroups} groups</span>
            </div>

            {loading ? (
              <div className="pp-loading">
                <div className="spinner"></div>
                <span>Loading plans...</span>
              </div>
            ) : Object.keys(plansByOrder).length === 0 ? (
              <div className="pp-empty">
                <span>📋</span>
                <span>No plans created yet</span>
              </div>
            ) : (
              <div className="pp-plans-list">
                {Object.entries(plansByOrder).map(
                  ([orderId, orderPlans]) => (
                    <div key={orderId} className="pp-plan-group">
                      <div className="pp-plan-group-top">
                        <span className="pp-plan-order">Order #{orderId}</span>
                        <div className="pp-plan-actions">
                          {orderPlans.some(
                            (p) =>
                              p.decision === "DRAFT" ||
                              p.decision === "PENDING",
                          ) && (
                            <>
                              <button
                                className="pp-btn-confirm"
                                onClick={() =>
                                  handleConfirmPlan(parseInt(orderId))
                                }
                              >
                                ✓ Confirm
                              </button>
                              <button
                                className="pp-btn-cancel"
                                onClick={() =>
                                  handleCancelPlan(parseInt(orderId))
                                }
                              >
                                ✗ Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <table className="pp-table pp-table-compact">
                        <thead>
                          <tr>
                            <th>Line</th>
                            <th>Quantity</th>
                            <th>Start</th>
                            <th>End</th>
                            <th>Est. Hours</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderPlans.map((plan) => (
                            <tr key={plan.planId || plan.id}>
                              <td className="pp-cell-id">
                                {plan.lineName || plan.line?.name}
                              </td>
                              <td className="pp-cell-num">
                                {(plan.plannedQuantity || 0).toLocaleString()}
                              </td>
                              <td className="pp-cell-muted">
                                {plan.plannedStartDate || plan.startDate}
                              </td>
                              <td className="pp-cell-muted">
                                {plan.plannedEndDate || plan.endDate}
                              </td>
                              <td className="pp-cell-num">
                                {Number(plan.estimatedHours || 0).toFixed(1)}h
                              </td>
                              <td>
                                <span
                                  className={`pp-decision ${getDecisionClass(plan.decision)}`}
                                >
                                  {plan.decision}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {orderPlans[0]?.note && (
                        <div className="pp-note">
                          <strong>Note:</strong> {orderPlans[0].note}
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
            )}
          </section>
        </div>

        {/* ── Create Plan Modal ── */}
        {showCreateModal && selectedOrder && (
          <div
            className="modal-overlay"
            onClick={() => setShowCreateModal(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create Production Plan</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowCreateModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                {/* Order Info */}
                <div className="order-summary">
                  <div className="summary-item">
                    <span className="summary-label">Order</span>
                    <span className="summary-value">#{selectedOrder.id}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Customer</span>
                    <span className="summary-value">
                      {selectedOrder.customerName}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Product</span>
                    <span className="summary-value">
                      {selectedOrder.productType}
                    </span>
                  </div>
                  <div className="summary-item highlight">
                    <span className="summary-label">Total Quantity Needed</span>
                    <span className="summary-value">
                      {(selectedOrder.quantity || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Deadline</span>
                    <span className="summary-value">
                      {selectedOrder.deadline}
                    </span>
                  </div>
                </div>

                {/* Form */}
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={planForm.startDate}
                    onChange={(e) =>
                      setPlanForm((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Note</label>
                  <textarea
                    value={planForm.note}
                    onChange={(e) =>
                      setPlanForm((prev) => ({ ...prev, note: e.target.value }))
                    }
                    className="form-textarea"
                    placeholder="Enter notes for the plan..."
                  />
                </div>

                {/* Line Allocation */}
                <div className="line-allocation">
                  <h3>Allocate to Lines</h3>
                  {planForm.lines.length === 0 ? (
                    <div className="pp-empty">
                      <span>No lines available for allocation</span>
                    </div>
                  ) : (
                    <div className="allocation-grid">
                      {planForm.lines.map((line) => (
                        <div key={line.lineId} className="allocation-item">
                          <div className="allocation-line-info">
                            <span className="allocation-line-name">
                              {line.lineName}
                            </span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            value={line.plannedQty}
                            onChange={(e) =>
                              handleLineQtyChange(line.lineId, e.target.value)
                            }
                            className="allocation-input"
                            placeholder="0"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="allocation-summary">
                    <span>Total Allocated: </span>
                    <span
                      className={
                        totalPlanned === selectedOrder.quantity
                          ? "match"
                          : "mismatch"
                      }
                    >
                      {totalPlanned.toLocaleString()} /{" "}
                      {(selectedOrder.quantity || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleCreatePlan}
                  disabled={totalPlanned === 0}
                >
                  Create Plan
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManagerPlanning;
