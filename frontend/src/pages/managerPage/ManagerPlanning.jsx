import React, { useState, useEffect } from "react";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import managerService from "../../services/managerService";
import "./ManagerPlanning.css";

const ManagerPlanning = () => {
  const [plans, setPlans] = useState([]);
  const [linesOverview, setLinesOverview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");

  // For creating a new plan by orderId
  const [newOrderId, setNewOrderId] = useState("");

  // Form state for creating plan
  const [planForm, setPlanForm] = useState({
    orderId: "",
    planName: "",
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
      setLinesOverview(linesRes || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Unable to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const openCreatePlanModal = (orderId) => {
    if (!orderId) {
      alert("Vui lòng nhập Order ID!");
      return;
    }
    setPlanForm({
      orderId: parseInt(orderId),
      planName: "",
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
      // Backend trả về ScheduleValidationResult trong response.data khi lỗi 400
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

  // Group plans by orderId
  const plansByOrder = plans.reduce((acc, plan) => {
    const orderId = plan.orderId || plan.order?.id;
    if (!acc[orderId]) {
      acc[orderId] = [];
    }
    acc[orderId].push(plan);
    return acc;
  }, {});

  const totalPlanned = planForm.lines.reduce((sum, l) => sum + l.plannedQty, 0);

  return (
    <div className="manager-container">
      <ManagerSidebar />

      <main className="manager-main">
        {/* Header */}
        <header className="manager-header">
          <div className="header-left">
            <h1>📋 Production Planning</h1>
            <p>Allocate orders to production lines</p>
          </div>
          <div className="header-right">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button className="btn-refresh" onClick={fetchData}>
              🔄 Refresh
            </button>
            <NotificationBell />
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button onClick={fetchData}>Retry</button>
          </div>
        )}

        <div className="planning-grid">
          {/* Create Plan for Order */}
          <section className="planning-card orders-section">
            <div className="card-header">
              <h2>📦 Tạo kế hoạch sản xuất</h2>
              <span className="card-subtitle">
                Nhập Order ID (từ thông báo hoặc Admin cung cấp) để lập kế hoạch
              </span>
            </div>
            <div className="card-content">
              <div
                className="create-plan-form"
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-end",
                  padding: "16px 0",
                }}
              >
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontWeight: 600,
                      fontSize: "14px",
                    }}
                  >
                    Order ID
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newOrderId}
                    onChange={(e) => setNewOrderId(e.target.value)}
                    placeholder="Nhập Order ID..."
                    className="form-input"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") openCreatePlanModal(newOrderId);
                    }}
                  />
                </div>
                <button
                  className="btn-create-plan"
                  onClick={() => openCreatePlanModal(newOrderId)}
                  disabled={!newOrderId || linesOverview.length === 0}
                  style={{ padding: "10px 24px", whiteSpace: "nowrap" }}
                >
                  📋 Lập kế hoạch
                </button>
              </div>
              {linesOverview.length === 0 && !loading && (
                <div className="no-data" style={{ marginTop: "8px" }}>
                  <span className="no-data-icon">⚠️</span>
                  <span>
                    Chưa có dây chuyền sản xuất nào. Không thể lập kế hoạch.
                  </span>
                </div>
              )}
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px 16px",
                  background: "#f0f9ff",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#1e40af",
                }}
              >
                💡 <strong>Hướng dẫn:</strong> Khi Admin xác nhận đơn hàng, bạn
                sẽ nhận thông báo. Nhập Order ID vào ô trên rồi nhấn "Lập kế
                hoạch" để phân bổ sản lượng cho các dây chuyền.
              </div>
            </div>
          </section>

          {/* Existing Plans */}
          <section className="planning-card plans-section">
            <div className="card-header">
              <h2>📊 Existing Plans</h2>
              <span className="card-subtitle">List of production plans</span>
            </div>
            <div className="card-content">
              {loading ? (
                <div className="loading-spinner">Loading...</div>
              ) : Object.keys(plansByOrder).length === 0 ? (
                <div className="no-data">
                  <span className="no-data-icon">📋</span>
                  <span>No plans available</span>
                </div>
              ) : (
                <div className="plans-list">
                  {Object.entries(plansByOrder).map(([orderId, orderPlans]) => (
                    <div key={orderId} className="plan-group">
                      <div className="plan-group-header">
                        <span className="plan-order-id">Order #{orderId}</span>
                        <div className="plan-group-actions">
                          {orderPlans.some((p) => p.decision === "DRAFT") && (
                            <>
                              <button
                                className="btn-confirm"
                                onClick={() =>
                                  handleConfirmPlan(parseInt(orderId))
                                }
                              >
                                ✓ Confirm
                              </button>
                              <button
                                className="btn-cancel"
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
                      <table className="plans-table">
                        <thead>
                          <tr>
                            <th>Plan Name</th>
                            <th>Line</th>
                            <th>Quantity</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Estimated Hours</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderPlans.map((plan) => (
                            <tr key={plan.planId}>
                              <td>{plan.planName || "—"}</td>
                              <td className="line-name">{plan.lineName}</td>
                              <td>
                                {(plan.plannedQuantity || 0).toLocaleString()}
                              </td>
                              <td>{plan.startDate}</td>
                              <td>{plan.endDate}</td>
                              <td>
                                {Number(plan.estimatedHours || 0).toFixed(1)}h
                              </td>
                              <td>
                                <span
                                  className={`decision-badge ${getDecisionClass(plan.decision)}`}
                                >
                                  {plan.decision}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {orderPlans[0]?.note && (
                        <div className="plan-note">
                          <strong>Note:</strong> {orderPlans[0].note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Create Plan Modal */}
        {showCreateModal && (
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
                  <div className="summary-item highlight">
                    <span className="summary-label">Order ID</span>
                    <span className="summary-value">#{planForm.orderId}</span>
                  </div>
                </div>

                {/* Form */}
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
                    <div className="no-data">
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
                    <span>Tổng phân bổ: </span>
                    <span className={totalPlanned > 0 ? "match" : "mismatch"}>
                      {totalPlanned.toLocaleString()} units
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
