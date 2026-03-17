import React, { useState, useEffect, useMemo } from "react";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import ManagerTopBar from "./ManagerTopBar";
import managerService from "../../services/managerService";
import PageLoading from "../../components/PageLoading/PageLoading";
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
  const [showOrderSelectModal, setShowOrderSelectModal] = useState(false);
  const [planForm, setPlanForm] = useState({
    orderId: "",
    planName: "",
    startDate: new Date().toISOString().split("T")[0],
    note: "",
    lines: [],
  });

  const getBackendErrorMessage = (err, fallback) => {
    const payload = err?.response?.data;

    if (typeof payload === "string" && payload.trim()) {
      return payload;
    }

    if (payload?.message) {
      return payload.message;
    }

    if (payload?.error) {
      return payload.error;
    }

    return fallback;
  };

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
            plannedQty: l.plannedQty,
          })),
      };
      await managerService.createPlan(request);
      alert("Plan created successfully!");
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      console.error("Error creating plan:", err);
      alert(getBackendErrorMessage(err, "Failed to create plan."));
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
      alert(getBackendErrorMessage(err, "Failed to confirm plan."));
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
      alert(getBackendErrorMessage(err, "Failed to cancel plan."));
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
      (o) => o.status === "Confirmed" && !plannedOrderIds.has(o.id),
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

  const confirmedCount = plans.filter((p) => p.decision === "CONFIRMED").length;

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

          {/* Toolbar removed – filter is now inside the redesigned Plans section */}

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
                <PageLoading variant="inline" text="Loading orders…" />
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
                <PageLoading variant="inline" text="" />
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

          {/* ── Production Plans Section (Redesigned) ── */}
          <section className="pp-panel pp-plans-section">
            <div className="pp-plans-header">
              <div className="pp-plans-header-left">
                <div className="pp-plans-icon">
                  <svg
                    width="20"
                    height="20"
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
                </div>
                <div>
                  <h2 className="pp-plans-title">Production Plans</h2>
                  <p className="pp-plans-subtitle">
                    Manage and track all production planning
                  </p>
                </div>
              </div>
              <div className="pp-plans-header-right">
                <button
                  className="pp-btn-new-plan"
                  onClick={() => {
                    if (awaitingOrders.length > 0) {
                      setShowOrderSelectModal(true);
                    } else {
                      alert(
                        "No orders awaiting planning. Please create or approve an order first.",
                      );
                    }
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  New Planning
                </button>
                <button className="pp-btn-refresh" onClick={fetchData}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            {/* Tab Filters */}
            <div className="pp-plans-tab-bar">
              <button
                className={`pp-plans-tab ${filterStatus === "" ? "active" : ""}`}
                onClick={() => setFilterStatus("")}
              >
                All <span className="pp-plans-tab-count">{plans.length}</span>
              </button>
              <button
                className={`pp-plans-tab ${filterStatus === "DRAFT" ? "active" : ""}`}
                onClick={() => setFilterStatus("DRAFT")}
              >
                Draft{" "}
                <span className="pp-plans-tab-count">
                  {
                    plans.filter(
                      (p) => p.decision === "DRAFT" || p.decision === "PENDING",
                    ).length
                  }
                </span>
              </button>
              <button
                className={`pp-plans-tab ${filterStatus === "CONFIRMED" ? "active" : ""}`}
                onClick={() => setFilterStatus("CONFIRMED")}
              >
                Confirmed{" "}
                <span className="pp-plans-tab-count">{confirmedCount}</span>
              </button>
              <button
                className={`pp-plans-tab ${filterStatus === "CANCELLED" ? "active" : ""}`}
                onClick={() => setFilterStatus("CANCELLED")}
              >
                Cancelled{" "}
                <span className="pp-plans-tab-count">
                  {plans.filter((p) => p.decision === "CANCELLED").length}
                </span>
              </button>
            </div>

            {loading ? (
              <PageLoading variant="inline" text="Loading plans…" />
            ) : Object.keys(filteredPlansByOrder).length === 0 ? (
              <div className="pp-plans-empty">
                <div className="pp-plans-empty-icon">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <h3>No plans found</h3>
                <p>
                  {filterStatus
                    ? `No ${filterStatus.toLowerCase()} plans available`
                    : "Start by creating a new production plan"}
                </p>
                <button
                  className="pp-btn-new-plan sm"
                  onClick={() => {
                    if (awaitingOrders.length > 0) {
                      setShowOrderSelectModal(true);
                    } else {
                      alert("No orders awaiting planning.");
                    }
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create First Plan
                </button>
              </div>
            ) : (
              <div className="pp-plans-grid">
                {Object.entries(filteredPlansByOrder).map(
                  ([orderId, orderPlans]) => {
                    const hasActionable = orderPlans.some(
                      (p) => p.decision === "DRAFT" || p.decision === "PENDING",
                    );
                    const totalQty = orderPlans.reduce(
                      (sum, p) => sum + (p.plannedQuantity || 0),
                      0,
                    );
                    const totalHours = orderPlans.reduce(
                      (sum, p) => sum + (p.estimatedHours || 0),
                      0,
                    );

                    return (
                      <div key={orderId} className="pp-plan-card">
                        <div className="pp-plan-card-header">
                          <div className="pp-plan-card-title-row">
                            <div className="pp-plan-card-order-badge">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                              </svg>
                              Order #{orderId}
                            </div>
                            <div className="pp-plan-card-meta">
                              <span className="pp-plan-card-chip">
                                {orderPlans.length}{" "}
                                {orderPlans.length === 1 ? "line" : "lines"}
                              </span>
                              <span className="pp-plan-card-chip qty">
                                {totalQty.toLocaleString()} units
                              </span>
                              <span className="pp-plan-card-chip hours">
                                {totalHours.toFixed(1)}h
                              </span>
                            </div>
                          </div>
                          {hasActionable && (
                            <div className="pp-plan-card-actions">
                              <button
                                className="pp-btn-card-confirm"
                                onClick={() =>
                                  handleConfirmPlan(parseInt(orderId))
                                }
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Confirm
                              </button>
                              <button
                                className="pp-btn-card-cancel"
                                onClick={() =>
                                  handleCancelPlan(parseInt(orderId))
                                }
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="pp-plan-card-body">
                          <table className="pp-plan-card-table">
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
                                  <td className="pp-plan-name-cell">
                                    {plan.planName || "—"}
                                  </td>
                                  <td>
                                    <span className="pp-plan-line-badge">
                                      {plan.lineName || `Line ${plan.lineId}`}
                                    </span>
                                  </td>
                                  <td className="pp-cell-num">
                                    {(
                                      plan.plannedQuantity || 0
                                    ).toLocaleString()}
                                  </td>
                                  <td className="pp-cell-muted">
                                    {plan.startDate}
                                  </td>
                                  <td className="pp-cell-muted">
                                    {plan.endDate}
                                  </td>
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
                        </div>

                        {orderPlans[0]?.note && (
                          <div className="pp-plan-card-note">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                            </svg>
                            {orderPlans[0].note}
                          </div>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </section>
        </div>

        {/* Order Selection Modal for New Planning */}
        {showOrderSelectModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowOrderSelectModal(false)}
          >
            <div
              className="modal-content pp-order-select-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#667eea"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: 8, verticalAlign: "middle" }}
                  >
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                  </svg>
                  Select Order for Planning
                </h2>
                <button
                  className="modal-close"
                  onClick={() => setShowOrderSelectModal(false)}
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
              <div className="modal-body" style={{ padding: "12px 22px 22px" }}>
                {awaitingOrders.length === 0 ? (
                  <div className="pp-empty">
                    <span>No orders awaiting planning</span>
                  </div>
                ) : (
                  <div className="pp-order-select-list">
                    {awaitingOrders.map((order) => (
                      <div
                        key={order.id}
                        className="pp-order-select-item"
                        onClick={() => {
                          setShowOrderSelectModal(false);
                          openCreateModal(order);
                        }}
                      >
                        <div className="pp-order-select-left">
                          <span className="pp-order-select-id">
                            #{order.id}
                          </span>
                          <div className="pp-order-select-info">
                            <span className="pp-order-select-customer">
                              {order.customerName}
                            </span>
                            <span className="pp-order-select-product">
                              {order.productType}
                            </span>
                          </div>
                        </div>
                        <div className="pp-order-select-right">
                          <span
                            className={`pp-priority ${getPriorityClass(order.priority)}`}
                          >
                            {order.priority}
                          </span>
                          <span className="pp-order-select-qty">
                            {(order.quantity || 0).toLocaleString()} units
                          </span>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#b0b7c8"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
