import React, { useState, useEffect, useMemo } from "react";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import ManagerTopBar from "./ManagerTopBar";
import managerService from "../../services/managerService";
import "./ManagerPlanning.css";

const ManagerPlanning = () => {
  const [plans, setPlans] = useState([]);
  const [linesOverview, setLinesOverview] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [planForm, setPlanForm] = useState({
    orderId: "",
    planName: "",
    startDate: new Date().toISOString().split("T")[0],
    note: "",
    lines: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [plansRes, linesRes, ordersRes] = await Promise.all([
        managerService.getAllPlans(),
        managerService.getLinesOverview(),
        managerService.getAllOrders(),
      ]);
      setPlans(plansRes || []);
      setLinesOverview(linesRes || []);
      setOrders(ordersRes || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Unable to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = (order) => {
    setSelectedOrder(order);
    setPlanForm({
      orderId: order.id,
      planName: "",
      startDate: new Date().toISOString().split("T")[0],
      note: "",
      lines: linesOverview.map((l) => ({
        lineId: l.lineId,
        lineName: l.lineName,
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
        planName: planForm.planName,
        startDate: planForm.startDate,
        note: planForm.note,
        lines: planForm.lines
          .filter((l) => l.plannedQty > 0)
          .map((l) => ({
            lineId: l.lineId,
            plannedQuantity: l.plannedQty,
          })),
      };
      await managerService.createPlan(request);
      alert("Plan created successfully!");
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      console.error("Error creating plan:", err);
      alert("Failed to create plan. Please try again.");
    }
  };

  const handleConfirmPlan = async (orderId) => {
    if (!window.confirm("Are you sure you want to confirm this plan?")) return;
    try {
      await managerService.confirmPlan(orderId);
      alert("Plan confirmed!");
      fetchData();
    } catch (err) {
      console.error("Error confirming plan:", err);
      alert("Failed to confirm plan.");
    }
  };

  const handleCancelPlan = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this plan?")) return;
    try {
      await managerService.cancelPlan(orderId);
      alert("Plan cancelled.");
      fetchData();
    } catch (err) {
      console.error("Error cancelling plan:", err);
      alert("Failed to cancel plan.");
    }
  };

  const getDecisionClass = (decision) => {
    switch (decision?.toUpperCase()) {
      case "CONFIRMED":
        return "decision-confirmed";
      case "DRAFT":
      case "PENDING":
        return "decision-pending";
      case "CANCELLED":
        return "decision-cancelled";
      default:
        return "decision-pending";
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

  const getLoadClass = (line) => {
    const utilization =
      ((line.busyHours || 0) / (line.availableHours || 8)) * 100;
    if (utilization >= 80) return "load-high";
    if (utilization >= 50) return "load-mid";
    return "load-low";
  };

  const awaitingOrders = useMemo(() => {
    const plannedOrderIds = new Set(
      (plans || []).map((p) => p.orderId || p.order?.id),
    );
    return (orders || []).filter(
      (o) =>
        (o.status === "Confirmed" || o.status === "Draft") &&
        !plannedOrderIds.has(o.id),
    );
  }, [orders, plans]);

  const filteredOrders = useMemo(() => {
    return awaitingOrders.filter((o) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        String(o.id).includes(q) ||
        (o.customerName || "").toLowerCase().includes(q) ||
        (o.productType || "").toLowerCase().includes(q)
      );
    });
  }, [awaitingOrders, searchTerm]);

  const plansByOrder = useMemo(() => {
    const grouped = {};
    (plans || []).forEach((p) => {
      const orderId = p.orderId || p.order?.id;
      if (!grouped[orderId]) grouped[orderId] = [];
      grouped[orderId].push(p);
    });
    return grouped;
  }, [plans]);

  const filteredPlansByOrder = useMemo(() => {
    if (!filterStatus) return plansByOrder;
    const result = {};
    Object.entries(plansByOrder).forEach(([orderId, orderPlans]) => {
      const filtered = orderPlans.filter(
        (p) => p.decision?.toUpperCase() === filterStatus.toUpperCase(),
      );
      if (filtered.length > 0) result[orderId] = filtered;
    });
    return result;
  }, [plansByOrder, filterStatus]);

  const totalPlanGroups = Object.keys(filteredPlansByOrder).length;
  const confirmedCount = plans.filter((p) => p.decision === "CONFIRMED").length;
  const pendingCount = plans.filter(
    (p) => p.decision === "DRAFT" || p.decision === "PENDING",
  ).length;

  const totalPlanned = selectedOrder
    ? planForm.lines.reduce((sum, l) => sum + l.plannedQty, 0)
    : 0;
  const allocPct = selectedOrder
    ? Math.min((totalPlanned / (selectedOrder.quantity || 1)) * 100, 100)
    : 0;

  return (
    <div className="manager-container">
      <ManagerSidebar />

      <main className="manager-main">
        <ManagerTopBar
          searchPlaceholder="Search orders, plans, customers..."
          onSearch={(term) => setSearchTerm(term)}
        />

        <div className="page-content">
          {error && (
            <div className="error-banner">
              <span>⚠️</span>
              <span>{error}</span>
              <button onClick={fetchData}>Retry</button>
            </div>
          )}

          <div className="pp-toolbar">
            <div className="pp-toolbar-left">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pp-select"
              >
                <option value="">All plan statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div
              className="pp-toolbar-right"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <span className="pp-badge">{totalPlanGroups} groups</span>
              {confirmedCount > 0 && (
                <span
                  className="pp-decision decision-confirmed"
                  style={{ fontSize: "11px" }}
                >
                  {confirmedCount} confirmed
                </span>
              )}
              {pendingCount > 0 && (
                <span
                  className="pp-decision decision-pending"
                  style={{ fontSize: "11px" }}
                >
                  {pendingCount} pending
                </span>
              )}
            </div>
          </div>

          <div className="pp-workspace">
            <section className="pp-panel pp-orders">
              <div className="pp-panel-header">
                <h2 className="pp-panel-title">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  Orders Awaiting Planning
                </h2>
                <span className="pp-badge">{filteredOrders.length}</span>
              </div>

              {loading ? (
                <div className="pp-loading">
                  <div className="spinner"></div>
                  <span>Loading orders…</span>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="pp-empty">
                  <div className="pp-empty-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                    </svg>
                  </div>
                  <span>
                    {searchTerm
                      ? "No matching orders"
                      : "No orders awaiting planning"}
                  </span>
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
                      {filteredOrders.map((order) => (
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

            <aside className="pp-panel pp-lines">
              <div className="pp-panel-header">
                <h2 className="pp-panel-title">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 20h.01" />
                    <path d="M7 20v-4" />
                    <path d="M12 20v-8" />
                    <path d="M17 20V8" />
                    <path d="M22 4v16" />
                  </svg>
                  Lines
                </h2>
                <span className="pp-badge">{linesOverview.length}</span>
              </div>

              {loading ? (
                <div className="pp-loading">
                  <div className="spinner"></div>
                </div>
              ) : linesOverview.length === 0 ? (
                <div className="pp-empty">
                  <span>No lines available</span>
                </div>
              ) : (
                <div className="pp-line-list">
                  {linesOverview.map((line, idx) => (
                    <React.Fragment key={line.lineId}>
                      <div className="pp-line-item">
                        <div className="pp-line-info">
                          <span className="pp-line-name">{line.lineName}</span>
                          <span
                            className={`ln-status ${
                              line.status?.toLowerCase() === "running"
                                ? "ln-st-running"
                                : line.status?.toLowerCase() === "idle"
                                  ? "ln-st-idle"
                                  : "ln-st-maintenance"
                            }`}
                          >
                            {line.status || "N/A"}
                          </span>
                        </div>
                        {line.availableHours && (
                          <div className="pp-line-cap">
                            <div className="pp-cap-bar">
                              <div
                                className={`pp-cap-fill ${getLoadClass(line)}`}
                                style={{
                                  width: `${Math.min(((line.busyHours || 0) / (line.availableHours || 8)) * 100, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="pp-cap-text">
                              {line.busyHours || 0}h /{" "}
                              {line.availableHours || 8}h capacity
                            </span>
                          </div>
                        )}
                      </div>
                      {idx < linesOverview.length - 1 && (
                        <div className="pp-line-divider" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </aside>
          </div>

          <section className="pp-panel pp-plans-section">
            <div className="pp-panel-header">
              <h2 className="pp-panel-title">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                Production Plans
              </h2>
            </div>

            {loading ? (
              <div className="pp-loading">
                <div className="spinner"></div>
                <span>Loading plans…</span>
              </div>
            ) : Object.keys(filteredPlansByOrder).length === 0 ? (
              <div className="pp-empty">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ccc"
                  strokeWidth="1.5"
                >
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>No plans found</span>
              </div>
            ) : (
              <div className="pp-plans-list">
                {Object.entries(filteredPlansByOrder).map(
                  ([orderId, orderPlans]) => (
                    <div key={orderId} className="pp-plan-group">
                      <div className="pp-plan-group-header">
                        <div className="pp-plan-group-info">
                          <h3>Order #{orderId}</h3>
                          <span className="pp-badge-sm">
                            {orderPlans.length}{" "}
                            {orderPlans.length === 1 ? "line" : "lines"}
                          </span>
                        </div>
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
                                ✕ Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <table className="pp-table pp-table-compact">
                        <thead>
                          <tr>
                            <th>Plan Name</th>
                            <th>Line</th>
                            <th>Quantity</th>
                            <th>Start</th>
                            <th>End</th>
                            <th>Hours</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderPlans.map((plan) => (
                            <tr key={plan.id || plan.planId}>
                              <td>{plan.planName || "—"}</td>
                              <td className="pp-cell-id">
                                {plan.lineName || `Line ${plan.lineId}`}
                              </td>
                              <td className="pp-cell-num">
                                {(plan.plannedQuantity || 0).toLocaleString()}
                              </td>
                              <td className="pp-cell-muted">
                                {plan.startDate}
                              </td>
                              <td className="pp-cell-muted">{plan.endDate}</td>
                              <td className="pp-cell-muted">
                                {(plan.estimatedHours || 0).toFixed(1)}h
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
                        <div className="pp-plan-note">
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

        {showCreateModal && selectedOrder && (
          <div
            className="modal-overlay"
            onClick={() => setShowCreateModal(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create Plan for Order #{selectedOrder.id}</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowCreateModal(false)}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="modal-body">
                <div className="order-summary">
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
                  <div className="summary-item">
                    <span className="summary-label">Deadline</span>
                    <span className="summary-value">
                      {selectedOrder.deadline}
                    </span>
                  </div>
                  <div className="summary-item highlight">
                    <span className="summary-label">Total Quantity</span>
                    <span className="summary-value">
                      {(selectedOrder.quantity || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Plan Name</label>
                  <input
                    type="text"
                    value={planForm.planName}
                    onChange={(e) =>
                      setPlanForm((prev) => ({
                        ...prev,
                        planName: e.target.value,
                      }))
                    }
                    className="form-input"
                    placeholder="Enter plan name..."
                  />
                </div>

                <div className="form-row">
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
                    <label>Note (optional)</label>
                    <input
                      type="text"
                      value={planForm.note}
                      onChange={(e) =>
                        setPlanForm((prev) => ({
                          ...prev,
                          note: e.target.value,
                        }))
                      }
                      className="form-input"
                      placeholder="Brief note…"
                    />
                  </div>
                </div>

                <div className="line-allocation">
                  <h3>
                    Allocate to Lines
                    <span className="alloc-hint">
                      Distribute quantity across lines
                    </span>
                  </h3>
                  {planForm.lines.length === 0 ? (
                    <div className="pp-empty">
                      <span>No lines available</span>
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
                    <div className="allocation-progress">
                      <div className="allocation-progress-bar">
                        <div
                          className={`allocation-progress-fill ${
                            totalPlanned === selectedOrder.quantity
                              ? "match"
                              : totalPlanned > selectedOrder.quantity
                                ? "over"
                                : "mismatch"
                          }`}
                          style={{ width: `${allocPct}%` }}
                        />
                      </div>
                    </div>
                    <span>
                      <span
                        className={
                          totalPlanned === selectedOrder.quantity
                            ? "match"
                            : "mismatch"
                        }
                      >
                        {totalPlanned.toLocaleString()}
                      </span>
                      {" / "}
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
