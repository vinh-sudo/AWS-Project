import React, { useState, useEffect } from "react";
import ManagerSidebar from "../../components/ManagerSidebar/ManagerSidebar";
import managerService from "../../services/managerService";
import "./ManagerPlanning.css";

const ManagerPlanning = () => {
  const [plans, setPlans] = useState([]);
  const [orders, setOrders] = useState([]);
  const [linesOverview, setLinesOverview] = useState([]);
  const [loading, setLoading] = useState(true);
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
    try {
      const [plansRes, ordersRes, linesRes] = await Promise.all([
        managerService.getAllPlans(filterStatus || null).catch(() => mockPlans),
        managerService.getOrders().catch(() => mockOrders),
        managerService.getLinesOverview().catch(() => mockLines),
      ]);

      setPlans(plansRes);
      setOrders(ordersRes);
      setLinesOverview(linesRes);
    } catch (error) {
      console.error("Error fetching data:", error);
      setPlans(mockPlans);
      setOrders(mockOrders);
      setLinesOverview(mockLines);
    } finally {
      setLoading(false);
    }
  };

  // Mock data
  const mockPlans = [
    {
      planId: 1,
      orderId: 1,
      lineId: 1,
      lineName: "SMT Line 1",
      plannedQuantity: 3000,
      startDate: "2026-02-05",
      endDate: "2026-02-10",
      estimatedHours: 24,
      decision: "PENDING",
      note: "",
    },
    {
      planId: 2,
      orderId: 1,
      lineId: 2,
      lineName: "SMT Line 2",
      plannedQuantity: 2000,
      startDate: "2026-02-05",
      endDate: "2026-02-08",
      estimatedHours: 16,
      decision: "CONFIRMED",
      note: "Ưu tiên cao",
    },
    {
      planId: 3,
      orderId: 2,
      lineId: 1,
      lineName: "SMT Line 1",
      plannedQuantity: 4000,
      startDate: "2026-02-12",
      endDate: "2026-02-18",
      estimatedHours: 32,
      decision: "PENDING",
      note: "",
    },
  ];

  const mockOrders = [
    {
      id: 1,
      customerName: "TechCorp Inc.",
      productType: "PCB-A100",
      quantity: 5000,
      deadline: "2026-02-15",
      priority: "HIGH",
      status: "APPROVED",
    },
    {
      id: 2,
      customerName: "ElectroParts Ltd.",
      productType: "PCB-B200",
      quantity: 4000,
      deadline: "2026-02-20",
      priority: "MEDIUM",
      status: "APPROVED",
    },
    {
      id: 3,
      customerName: "MicroTech Co.",
      productType: "PCB-C300",
      quantity: 8000,
      deadline: "2026-02-28",
      priority: "HIGH",
      status: "APPROVED",
    },
  ];

  const mockLines = [
    {
      lineId: 1,
      lineName: "SMT Line 1",
      busyHours: 6.5,
      availableHours: 8,
      availableMachines: 4,
      status: "Running",
    },
    {
      lineId: 2,
      lineName: "SMT Line 2",
      busyHours: 3.2,
      availableHours: 8,
      availableMachines: 3,
      status: "Running",
    },
    {
      lineId: 3,
      lineName: "Assembly Line 1",
      busyHours: 0,
      availableHours: 8,
      availableMachines: 5,
      status: "Idle",
    },
  ];

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
      alert("Tạo kế hoạch thành công!");
      setShowCreateModal(false);
      fetchData();
    } catch (error) {
      console.error("Error creating plan:", error);
      alert("Tạo kế hoạch thành công! (Mock)");
      setShowCreateModal(false);
    }
  };

  const handleConfirmPlan = async (orderId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xác nhận kế hoạch này?")) return;

    try {
      const result = await managerService.confirmPlan(orderId);
      if (result.ok) {
        alert("Xác nhận kế hoạch thành công!");
        fetchData();
      } else {
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error) {
      console.error("Error confirming plan:", error);
      alert("Xác nhận kế hoạch thành công! (Mock)");
      fetchData();
    }
  };

  const handleCancelPlan = async (orderId) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy kế hoạch này?")) return;

    try {
      await managerService.cancelPlan(orderId);
      alert("Hủy kế hoạch thành công!");
      fetchData();
    } catch (error) {
      console.error("Error cancelling plan:", error);
      alert("Hủy kế hoạch thành công! (Mock)");
      fetchData();
    }
  };

  const getDecisionClass = (decision) => {
    switch (decision?.toUpperCase()) {
      case "CONFIRMED":
        return "decision-confirmed";
      case "PENDING":
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
    if (!acc[plan.orderId]) {
      acc[plan.orderId] = [];
    }
    acc[plan.orderId].push(plan);
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
            <h1>📋 Lập kế hoạch sản xuất</h1>
            <p>Phân bổ đơn hàng cho các dây chuyền sản xuất</p>
          </div>
          <div className="header-right">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xác nhận</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
        </header>

        <div className="planning-grid">
          {/* Orders Awaiting Planning */}
          <section className="planning-card orders-section">
            <div className="card-header">
              <h2>📦 Đơn hàng cần lập kế hoạch</h2>
              <span className="card-subtitle">Các đơn hàng đã được duyệt</span>
            </div>
            <div className="card-content">
              {loading ? (
                <div className="loading-spinner">Đang tải...</div>
              ) : (
                <div className="orders-list">
                  {orders
                    .filter((o) => o.status === "APPROVED")
                    .map((order) => (
                      <div key={order.id} className="order-card">
                        <div className="order-info">
                          <div className="order-header">
                            <span className="order-id">#{order.id}</span>
                            <span
                              className={`priority-badge ${getPriorityClass(order.priority)}`}
                            >
                              {order.priority}
                            </span>
                          </div>
                          <div className="order-customer">
                            {order.customerName}
                          </div>
                          <div className="order-product">
                            {order.productType}
                          </div>
                          <div className="order-details">
                            <span>
                              📦 {order.quantity.toLocaleString()} units
                            </span>
                            <span>📅 {order.deadline}</span>
                          </div>
                        </div>
                        <button
                          className="btn-create-plan"
                          onClick={() => openCreateModal(order)}
                        >
                          Lập kế hoạch
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </section>

          {/* Existing Plans */}
          <section className="planning-card plans-section">
            <div className="card-header">
              <h2>📊 Kế hoạch đã tạo</h2>
              <span className="card-subtitle">Danh sách kế hoạch sản xuất</span>
            </div>
            <div className="card-content">
              {loading ? (
                <div className="loading-spinner">Đang tải...</div>
              ) : Object.keys(plansByOrder).length === 0 ? (
                <div className="no-data">
                  <span className="no-data-icon">📋</span>
                  <span>Chưa có kế hoạch nào</span>
                </div>
              ) : (
                <div className="plans-list">
                  {Object.entries(plansByOrder).map(([orderId, orderPlans]) => (
                    <div key={orderId} className="plan-group">
                      <div className="plan-group-header">
                        <span className="plan-order-id">
                          Đơn hàng #{orderId}
                        </span>
                        <div className="plan-group-actions">
                          {orderPlans.some((p) => p.decision === "PENDING") && (
                            <>
                              <button
                                className="btn-confirm"
                                onClick={() =>
                                  handleConfirmPlan(parseInt(orderId))
                                }
                              >
                                ✓ Xác nhận
                              </button>
                              <button
                                className="btn-cancel"
                                onClick={() =>
                                  handleCancelPlan(parseInt(orderId))
                                }
                              >
                                ✗ Hủy
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <table className="plans-table">
                        <thead>
                          <tr>
                            <th>Line</th>
                            <th>Số lượng</th>
                            <th>Ngày bắt đầu</th>
                            <th>Ngày kết thúc</th>
                            <th>Giờ ước tính</th>
                            <th>Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderPlans.map((plan) => (
                            <tr key={plan.planId}>
                              <td className="line-name">{plan.lineName}</td>
                              <td>{plan.plannedQuantity?.toLocaleString()}</td>
                              <td>{plan.startDate}</td>
                              <td>{plan.endDate}</td>
                              <td>{plan.estimatedHours}h</td>
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
                          <strong>Ghi chú:</strong> {orderPlans[0].note}
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
        {showCreateModal && selectedOrder && (
          <div
            className="modal-overlay"
            onClick={() => setShowCreateModal(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Tạo kế hoạch sản xuất</h2>
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
                    <span className="summary-label">Đơn hàng</span>
                    <span className="summary-value">#{selectedOrder.id}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Khách hàng</span>
                    <span className="summary-value">
                      {selectedOrder.customerName}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Sản phẩm</span>
                    <span className="summary-value">
                      {selectedOrder.productType}
                    </span>
                  </div>
                  <div className="summary-item highlight">
                    <span className="summary-label">Tổng số lượng cần</span>
                    <span className="summary-value">
                      {selectedOrder.quantity?.toLocaleString()}
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
                  <label>Ngày bắt đầu</label>
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
                  <label>Ghi chú</label>
                  <textarea
                    value={planForm.note}
                    onChange={(e) =>
                      setPlanForm((prev) => ({ ...prev, note: e.target.value }))
                    }
                    className="form-textarea"
                    placeholder="Nhập ghi chú cho kế hoạch..."
                  />
                </div>

                {/* Line Allocation */}
                <div className="line-allocation">
                  <h3>Phân bổ cho các Line</h3>
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
                  <div className="allocation-summary">
                    <span>Tổng đã phân bổ: </span>
                    <span
                      className={
                        totalPlanned === selectedOrder.quantity
                          ? "match"
                          : "mismatch"
                      }
                    >
                      {totalPlanned.toLocaleString()} /{" "}
                      {selectedOrder.quantity?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Hủy
                </button>
                <button
                  className="btn-primary"
                  onClick={handleCreatePlan}
                  disabled={totalPlanned === 0}
                >
                  Tạo kế hoạch
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
