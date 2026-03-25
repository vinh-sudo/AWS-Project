import React, { useState, useEffect, useMemo } from "react";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import ManagerTopBar from "./ManagerTopBar";
import managerService from "../../services/managerService";
import PageLoading from "../../components/PageLoading/PageLoading";
import useConfirmDialog from "../../components/ConfirmDialog/useConfirmDialog";
import "./ManagerPlanning.css";

const getRouteRank = (lineName) => {
  const normalized = (lineName || "").toUpperCase();
  if (normalized.includes("SMT")) return 0;
  if (normalized.includes("DIP")) return 1;
  if (normalized.includes("TEST")) return 2;
  if (normalized.includes("PACK")) return 3;
  return 99;
};

const extractAnchorPlans = (orderPlans) => {
  const anchorByItemAndDecision = {};

  (orderPlans || []).forEach((plan) => {
    const itemId = plan.orderItemId ?? "NO_ITEM";
    const decision = (plan.decision || "").toUpperCase();
    const key = `${itemId}-${decision}`;
    const nextRank = getRouteRank(plan.lineName);
    const current = anchorByItemAndDecision[key];

    if (!current || nextRank < current.rank) {
      anchorByItemAndDecision[key] = { rank: nextRank, plan };
    }
  });

  return Object.values(anchorByItemAndDecision).map((entry) => entry.plan);
};

const ManagerPlanning = () => {
  const [plans, setPlans] = useState([]);
  const [linesOverview, setLinesOverview] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedPlanningItemId, setSelectedPlanningItemId] = useState(null);
  const [orderItemViewByOrder, setOrderItemViewByOrder] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOrderSelectModal, setShowOrderSelectModal] = useState(false);
  const [planForm, setPlanForm] = useState({
    orderId: "",
    planName: "",
    startDate: new Date().toISOString().split("T")[0],
    note: "",
    items: [],
  });
  const confirmAction = useConfirmDialog();

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

  const formatOrderItemLabel = (item) => {
    if (!item) return "";
    const name = item.productName || `Item ${item.id}`;
    const qty = Number(item.quantity) || 0;
    return `#${item.id} - ${name} (${qty.toLocaleString()} units)`;
  };

  const getOrderTotalQty = (order) => {
    if (!order) return 0;
    const items = Array.isArray(order.items) ? order.items : [];
    if (items.length > 0) {
      return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    }
    return Number(order.quantity) || 0;
  };

  const formatHours = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "0";
    return num.toLocaleString(undefined, { maximumFractionDigits: 1 });
  };

  const getOrderById = (orderId) =>
    (orders || []).find((order) => Number(order.id) === Number(orderId));

  const getOrderItemById = (order, orderItemId) => {
    const items = Array.isArray(order?.items) ? order.items : [];
    return items.find((item) => Number(item.id) === Number(orderItemId));
  };

  const groupPlansByOrderItem = (orderPlans) => {
    const groups = {};
    (orderPlans || []).forEach((plan) => {
      const itemId = Number(plan.orderItemId);
      const key = Number.isFinite(itemId) ? itemId : "NO_ITEM";
      if (!groups[key]) groups[key] = [];
      groups[key].push(plan);
    });
    return groups;
  };

  const buildPlanItemsFromBackendView = (order, backendView) => {
    const orderItems = Array.isArray(order?.items) ? order.items : [];
    const itemById = Object.fromEntries(orderItems.map((item) => [item.id, item]));
    const backendItems = Array.isArray(backendView?.items) ? backendView.items : [];

    if (backendItems.length > 0) {
      return backendItems.map((viewItem) => {
        const orderItem = itemById[viewItem.orderItemId] || {
          id: viewItem.orderItemId,
          quantity: viewItem.requiredQuantity,
          productName: `Item ${viewItem.orderItemId}`,
        };

        return {
          orderItemId: Number(viewItem.orderItemId),
          label: formatOrderItemLabel(orderItem),
          requiredQty: Number(viewItem.requiredQuantity) || 0,
          confirmedQty: Number(viewItem.confirmedQuantity) || 0,
          draftQty: Number(viewItem.draftQuantity) || 0,
          remainingQty: Math.max(Number(viewItem.remainingQuantity) || 0, 0),
          canConfirm: Boolean(viewItem.canConfirm),
          confirmBlockedReason: viewItem.confirmBlockedReason || "",
          plannedQty: 0,
        };
      });
    }

    return [];
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

      const draftOrderIds = [
        ...new Set(
          (plansRes || [])
            .filter((p) => {
              const decision = (p.decision || "").toUpperCase();
              return decision === "DRAFT" || decision === "PENDING";
            })
            .map((p) => Number(p.orderId || p.order?.id))
            .filter((id) => Number.isFinite(id)),
        ),
      ];

      const itemViewsEntries = await Promise.all(
        draftOrderIds.map(async (orderId) => {
          try {
            const view = await managerService.getOrderItemPlansView(orderId);
            return [orderId, view];
          } catch (viewErr) {
            console.warn(
              `Unable to fetch order item planning view for order ${orderId}:`,
              viewErr,
            );
            return [orderId, null];
          }
        }),
      );

      const itemViewMap = Object.fromEntries(
        itemViewsEntries.filter(([, view]) => !!view),
      );

      setPlans(plansRes || []);
      setLinesOverview(linesRes || []);
      setOrders(ordersRes || []);
      setOrderItemViewByOrder(itemViewMap);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Unable to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const plansByOrder = useMemo(() => {
    const grouped = {};
    (plans || []).forEach((p) => {
      const orderId = p.orderId || p.order?.id;
      if (!grouped[orderId]) grouped[orderId] = [];
      grouped[orderId].push(p);
    });
    return grouped;
  }, [plans]);

  const planQtyByOrderItem = useMemo(() => {
    const qtyMap = {};

    Object.entries(plansByOrder).forEach(([orderId, orderPlans]) => {
      const perItem = {};
      extractAnchorPlans(orderPlans).forEach((plan) => {
        const itemId = Number(plan.orderItemId);
        if (!Number.isFinite(itemId)) return;

        if (!perItem[itemId]) {
          perItem[itemId] = { draftQty: 0, confirmedQty: 0 };
        }

        const qty = Number(plan.plannedQuantity) || 0;
        const decision = (plan.decision || "").toUpperCase();
        if (decision === "CONFIRMED") {
          perItem[itemId].confirmedQty += qty;
        } else if (decision === "DRAFT" || decision === "PENDING") {
          perItem[itemId].draftQty += qty;
        }
      });

      qtyMap[orderId] = perItem;
    });

    return qtyMap;
  }, [plansByOrder]);

  const openCreateModal = async (order) => {
    let planItems = [];
    try {
      const backendView = await managerService.getOrderItemPlansView(order.id);
      planItems = buildPlanItemsFromBackendView(order, backendView);
    } catch (err) {
      alert(getBackendErrorMessage(err, "Unable to load order item planning data."));
      return;
    }

    setSelectedOrder(order);
    setPlanForm({
      orderId: order.id,
      planName: "",
      startDate: new Date().toISOString().split("T")[0],
      note: "",
      items: planItems,
    });
    setSelectedPlanningItemId(null);
    setShowCreateModal(true);
  };

  const handleChooseOrderItemForPlanning = (orderItemId) => {
    setSelectedPlanningItemId(orderItemId);
    setPlanForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.orderItemId === orderItemId
          ? {
              ...item,
              plannedQty: item.plannedQty > 0 ? item.plannedQty : 1,
            }
          : { ...item, plannedQty: 0 },
      ),
    }));
  };

  const handleItemPlannedQtyChange = (orderItemId, qty) => {
    const normalizedQty = Math.max(parseInt(qty, 10) || 0, 0);
    setPlanForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.orderItemId === orderItemId
          ? {
              ...item,
              plannedQty: Math.min(normalizedQty, item.remainingQty),
            }
          : item,
      ),
    }));
  };

  const handleCreatePlan = async () => {
    try {
      const orderItems = Array.isArray(selectedOrder?.items)
        ? selectedOrder.items
        : [];
      const selectedItem = planForm.items.find(
        (item) => item.orderItemId === selectedPlanningItemId,
      );

      if (!planForm.planName.trim()) {
        alert("Plan name is required.");
        return;
      }

      if (orderItems.length === 0) {
        alert("This order has no order items. Please check order details first.");
        return;
      }

      if (!selectedItem) {
        alert("Please choose an order item and click New Planning first.");
        return;
      }

      if (selectedItem.plannedQty <= 0) {
        alert("Planned quantity must be greater than 0.");
        return;
      }

      if (selectedItem.plannedQty > selectedItem.remainingQty) {
        alert(
          `Planned qty exceeds remaining qty for order item #${selectedItem.orderItemId}.`,
        );
        return;
      }

      const baseRequest = {
        orderId: planForm.orderId,
        planName: planForm.planName.trim(),
        startDate: planForm.startDate,
        note: planForm.note.trim(),
      };

      await managerService.createPlanByItem({
        ...baseRequest,
        orderItemId: Number(selectedItem.orderItemId),
        plannedQty: Number(selectedItem.plannedQty),
      });

      alert(`Created plan for item #${selectedItem.orderItemId}.`);
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      console.error("Error creating plan:", err);
      alert(getBackendErrorMessage(err, "Failed to create plan."));
    }
  };

  const handleConfirmOrderItem = async (orderId, orderItemId) => {
    const accepted = await confirmAction({
      title: "Confirm Planning Item",
      message: `Confirm plan for item #${orderItemId}?`,
      confirmText: "Confirm",
      cancelText: "Cancel",
    });

    if (!accepted) {
      return;
    }

    try {
      const backendView = await managerService.getOrderItemPlansView(orderId);
      const targetItem = (backendView?.items || []).find(
        (item) => Number(item.orderItemId) === Number(orderItemId),
      );

      if (!targetItem) {
        alert("Order item not found in planning view.");
        return;
      }

      if (!targetItem.canConfirm) {
        alert(targetItem.confirmBlockedReason || "This order item cannot be confirmed now.");
        return;
      }

      await managerService.confirmPlanItem(orderId, orderItemId);
      alert(`Item #${orderItemId} confirmed.`);
      fetchData();
    } catch (err) {
      console.error("Error confirming order item:", err);
      alert(getBackendErrorMessage(err, "Failed to confirm order item."));
    }
  };

  const handleCancelOrderItem = async (orderId, orderItemId) => {
    const accepted = await confirmAction({
      title: "Cancel Draft Plan",
      message: `Cancel draft plan for item #${orderItemId}?`,
      confirmText: "Cancel Draft",
      cancelText: "Back",
      tone: "danger",
    });

    if (!accepted) {
      return;
    }

    try {
      const backendView = await managerService.getOrderItemPlansView(orderId);
      const items = backendView?.items || [];
      const targetItem = items.find(
        (item) => Number(item.orderItemId) === Number(orderItemId),
      );

      if (!targetItem) {
        alert("Order item not found in planning view.");
        return;
      }

      if ((Number(targetItem.draftQuantity) || 0) <= 0) {
        alert("This order item has no draft plan to cancel.");
        return;
      }

      await managerService.cancelPlanItem(orderId, orderItemId);
      alert(`Cancelled draft plan for item #${orderItemId}.`);
      fetchData();
    } catch (err) {
      console.error("Error cancelling order item:", err);
      alert(getBackendErrorMessage(err, "Failed to cancel order item."));
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
    return (orders || []).filter((o) => {
      const orderPlans = plansByOrder[o.id] || [];
      const decisions = orderPlans.map((p) => (p.decision || "").toUpperCase());
      const itemPlanQty = planQtyByOrderItem[o.id] || {};
      const orderItems = Array.isArray(o.items) ? o.items : [];

      const hasDraft =
        decisions.includes("DRAFT") || decisions.includes("PENDING");
      const hasCancelled = decisions.includes("CANCELLED");
      const status = (o.status || "").toUpperCase();
      const hasRemainingItem = orderItems.some((item) => {
        const requiredQty = Number(item.quantity) || 0;
        const confirmedQty = itemPlanQty[item.id]?.confirmedQty || 0;
        return confirmedQty < requiredQty;
      });

      if (
        ["CONFIRMED", "PLANNING", "PARTIALLY_SCHEDULED"].includes(status) &&
        (hasRemainingItem || orderItems.length === 0)
      ) {
        return true;
      }

      if (hasDraft) {
        return true;
      }

      if (
        hasCancelled &&
        (status === "NEW" || status === "PARTIALLY_SCHEDULED") &&
        (hasRemainingItem || orderItems.length === 0)
      ) {
        return true;
      }

      return false;
    });
  }, [orders, plansByOrder, planQtyByOrderItem]);

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

  const selectedPlanningItem = planForm.items.find(
    (item) => item.orderItemId === selectedPlanningItemId,
  );

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
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="pp-cell-id">#{order.id}</td>
                          <td>{order.customerName}</td>
                          <td className="pp-cell-muted">{order.productType}</td>
                          <td className="pp-cell-num">
                            {getOrderTotalQty(order).toLocaleString()}
                          </td>
                          <td>
                            <span
                              className={`pp-priority ${getPriorityClass(order.priority)}`}
                            >
                              {order.priority}
                            </span>
                          </td>
                          <td className="pp-cell-muted">{order.deadline}</td>
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
                              {formatHours(line.busyHours)}h /{" "}
                              {formatHours(line.availableHours || 8)}h capacity
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
                    const orderIdNum = Number(orderId);
                    const orderEntity = getOrderById(orderIdNum);
                    const anchorPlans = extractAnchorPlans(orderPlans);
                    const totalQty = anchorPlans.reduce(
                      (sum, p) => sum + (p.plannedQuantity || 0),
                      0,
                    );
                    const itemCount = new Set(
                      anchorPlans
                        .map((p) => Number(p.orderItemId))
                        .filter((itemId) => Number.isFinite(itemId)),
                    ).size;
                    const totalHours = orderPlans.reduce(
                      (sum, p) => sum + (p.estimatedHours || 0),
                      0,
                    );
                    const plansByItem = groupPlansByOrderItem(orderPlans);

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
                                {itemCount} {itemCount === 1 ? "item" : "items"}
                              </span>
                              <span className="pp-plan-card-chip qty">
                                {totalQty.toLocaleString()} units
                              </span>
                              <span className="pp-plan-card-chip hours">
                                {totalHours.toFixed(1)}h
                              </span>
                            </div>
                          </div>
                          <div className="pp-plan-card-actions" />
                        </div>

                        <div className="pp-plan-card-body">
                          {Object.entries(plansByItem).map(
                            ([itemIdKey, itemPlans]) => {
                              const itemId = Number(itemIdKey);
                              const anchorItemPlans = extractAnchorPlans(itemPlans);
                              const hasItemDraft = anchorItemPlans.some(
                                (p) =>
                                  (p.decision || "").toUpperCase() === "DRAFT" ||
                                  (p.decision || "").toUpperCase() === "PENDING",
                              );
                              const itemQty = anchorItemPlans.reduce(
                                (sum, p) => sum + (p.plannedQuantity || 0),
                                0,
                              );
                              const itemHours = itemPlans.reduce(
                                (sum, p) => sum + (p.estimatedHours || 0),
                                0,
                              );
                              const orderItem = getOrderItemById(orderEntity, itemId);
                              const itemLabel = orderItem
                                ? formatOrderItemLabel(orderItem)
                                : `Item #${itemId}`;
                              const itemView = orderItemViewByOrder[
                                Number(orderIdNum)
                              ]?.items?.find(
                                (itemViewRow) =>
                                  Number(itemViewRow.orderItemId) === Number(itemId),
                              );
                              const itemCanConfirm = itemView
                                ? Boolean(itemView.canConfirm)
                                : true;
                              const itemConfirmBlockedReason =
                                itemView && !itemCanConfirm
                                  ? itemView.confirmBlockedReason ||
                                    "This order item cannot be confirmed now."
                                  : "";

                              return (
                                <div key={`${orderId}-${itemIdKey}`} className="pp-item-plan-block">
                                  <div className="pp-item-plan-header">
                                    <div className="pp-item-plan-title">{itemLabel}</div>
                                    <div className="pp-item-plan-meta">
                                      <span className="pp-plan-card-chip qty">
                                        {itemQty.toLocaleString()} units
                                      </span>
                                      <span className="pp-plan-card-chip hours">
                                        {itemHours.toFixed(1)}h
                                      </span>
                                      {hasItemDraft && Number.isFinite(itemId) ? (
                                        <>
                                          <button
                                            className="pp-btn-card-confirm"
                                            disabled={!itemCanConfirm}
                                            title={
                                              itemConfirmBlockedReason ||
                                              "Confirm this order item"
                                            }
                                            onClick={() =>
                                              handleConfirmOrderItem(orderIdNum, itemId)
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
                                            Confirm item
                                          </button>
                                          <button
                                            className="pp-btn-card-cancel"
                                            onClick={() =>
                                              handleCancelOrderItem(orderIdNum, itemId)
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
                                            Cancel item
                                          </button>
                                        </>
                                      ) : null}
                                    </div>
                                  </div>
                                  {itemConfirmBlockedReason ? (
                                    <div className="pp-item-plan-warning">
                                      {itemConfirmBlockedReason}
                                    </div>
                                  ) : null}

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
                                      {itemPlans.map((plan) => (
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
                                            {(plan.plannedQuantity || 0).toLocaleString()}
                                          </td>
                                          <td className="pp-cell-muted">{plan.startDate}</td>
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

                                  {itemPlans[0]?.note ? (
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
                                      {itemPlans[0].note}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            },
                          )}
                        </div>
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
                            {getOrderTotalQty(order).toLocaleString()} units
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
                      {getOrderTotalQty(selectedOrder).toLocaleString()}
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
                    Order Item Planning
                    <span className="alloc-hint">
                      One item per plan action
                    </span>
                  </h3>
                  {Array.isArray(selectedOrder.items) &&
                  selectedOrder.items.length > 0 ? (
                    <div className="allocation-item-summary">
                      {selectedOrder.items.map((item) => (
                        <span key={item.id} className="allocation-item-chip">
                          {formatOrderItemLabel(item)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="pp-empty">
                      <span>
                        This order has no order items. Cannot create plan.
                      </span>
                    </div>
                  )}
                  {planForm.items.length === 0 ? (
                    <div className="pp-empty">
                      <span>No order items available for planning</span>
                    </div>
                  ) : (
                    <div className="allocation-grid">
                      {planForm.items.map((item) => (
                        <div
                          key={item.orderItemId}
                          className={`allocation-item ${
                            selectedPlanningItemId === item.orderItemId ? "active" : ""
                          }`}
                        >
                          <div className="allocation-item-main">
                            <div className="allocation-line-info">
                              <span className="allocation-line-name">
                                {item.label}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="allocation-item-action"
                              onClick={() =>
                                handleChooseOrderItemForPlanning(item.orderItemId)
                              }
                              disabled={item.remainingQty === 0}
                            >
                              {selectedPlanningItemId === item.orderItemId
                                ? "Selected"
                                : "New Planning"}
                            </button>
                          </div>
                          <div className="allocation-item-meta">
                            <span className="allocation-item-select">
                              Remaining: {item.remainingQty.toLocaleString()} / {item.requiredQty.toLocaleString()}
                            </span>
                            {item.remainingQty === 0 ? (
                              <span className="allocation-item-hint">
                                Fully planned / confirmed
                              </span>
                            ) : null}
                          </div>
                          {selectedPlanningItemId === item.orderItemId ? (
                            <div className="allocation-selected-editor">
                              <label>Planned Quantity</label>
                              <input
                                type="number"
                                min="1"
                                max={item.remainingQty}
                                value={item.plannedQty}
                                onChange={(e) =>
                                  handleItemPlannedQtyChange(
                                    item.orderItemId,
                                    e.target.value,
                                  )
                                }
                                className="allocation-input"
                                placeholder="0"
                              />
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedPlanningItem ? (
                    <div className="allocation-summary">
                      <span>
                        Selected item #{selectedPlanningItem.orderItemId} • Remaining {selectedPlanningItem.remainingQty.toLocaleString()}
                      </span>
                      <span>
                        Planning: {Number(selectedPlanningItem.plannedQty || 0).toLocaleString()} units
                      </span>
                    </div>
                  ) : null}
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
                  disabled={
                    !selectedPlanningItem ||
                    Number(selectedPlanningItem.plannedQty || 0) <= 0 ||
                    Number(selectedPlanningItem.remainingQty || 0) <= 0
                  }
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
