import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import AdminSidebar from "../../components/AdminSidebar/AdminSidebar";
import authService from "../../services/authService";
import adminService from "../../services/adminService";
import PageLoading from "../../components/PageLoading/PageLoading";
import "./AdminOrders.css";
import "./AdminDashboard.css";

/* ===== SVG Icon Components ===== */
const I = {
  search: (
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
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  plus: (
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
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  refresh: (
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
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  ),
  eye: (
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
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  edit: (
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
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  check: (
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
  ),
  play: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  checkCircle: (
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
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  stop: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  ),
  rotateCw: (
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
  ),
  xCircle: (
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
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  trash: (
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
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  ),
  close: (
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
  ),
  upload: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  file: (
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
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  minus: (
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
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  package: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  layers: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  zap: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  alertTriangle: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  checkSmall: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

/* ===== Helpers ===== */
const getStatusKey = (status) => {
  switch (status) {
    case "Draft":
      return "draft";
    case "Confirmed":
      return "confirmed";
    case "PLANNING":
      return "planning";
    case "SCHEDULED":
      return "scheduled";
    case "In Production":
      return "production";
    case "Completed":
      return "completed";
    case "Cancelled":
      return "cancelled";
    case "STOPPED":
      return "stopped";
    default:
      return "draft";
  }
};

const STATUS_DISPLAY = {
  STOPPED: "Stopped",
  PLANNING: "Planning",
  SCHEDULED: "Scheduled",
};

const getStatusDisplay = (status) =>
  STATUS_DISPLAY[status] || status || "Unknown";

const getPriorityKey = (priority) => {
  switch (priority?.toUpperCase()) {
    case "URGENT":
    case "CRITICAL":
      return "critical";
    case "HIGH":
      return "high";
    case "MEDIUM":
      return "medium";
    case "LOW":
      return "low";
    default:
      return "medium";
  }
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-US") : "—");
const formatCurrency = (v) =>
  v != null
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(v)
    : "—";

/* Timeline step order for progress stepper */
const TIMELINE_STEPS = [
  "Draft",
  "Confirmed",
  "PLANNING",
  "SCHEDULED",
  "In Production",
  "Completed",
];

const getTimelineState = (orderStatus, stepLabel) => {
  const statusIdx = TIMELINE_STEPS.indexOf(
    orderStatus === "STOPPED" ? "In Production" : orderStatus,
  );
  const stepIdx = TIMELINE_STEPS.indexOf(stepLabel);
  if (stepIdx < 0 || statusIdx < 0) return "";
  if (stepIdx < statusIdx) return "done";
  if (stepIdx === statusIdx) return "current";
  return "";
};

/* ===== Component ===== */
const AdminOrders = () => {
  const currentUser = authService.getCurrentUser();
  const searchRef = useRef(null);

  /* --- state --- */
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState({
    type: "",
    orderId: null,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    customerName: "",
    productType: "",
    quantity: "",
    deadline: "",
    priority: "Medium",
    items: [],
  });

  const [editingOrder, setEditingOrder] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);

  /* --- data --- */
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getAllOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to load orders",
      );
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /* --- keyboard shortcuts --- */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger inside inputs/textareas
      const tag = e.target.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (e.key === "/" && !isInput) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "n" && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowCreateModal(true);
      }
      if (e.key === "Escape") {
        if (showDetailModal) setShowDetailModal(false);
        else if (showCreateModal) {
          setShowCreateModal(false);
          resetForm();
        } else if (showEditModal) {
          setShowEditModal(false);
          resetForm();
        } else if (showConfirmModal) setShowConfirmModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDetailModal, showCreateModal, showEditModal, showConfirmModal]);

  /* --- computed --- */
  const filteredOrders = useMemo(
    () =>
      orders.filter((o) => {
        const s = searchTerm.toLowerCase();
        const matchSearch =
          o.customerName?.toLowerCase().includes(s) ||
          o.productType?.toLowerCase().includes(s) ||
          o.id?.toString().includes(searchTerm);
        const matchStatus = statusFilter === "All" || o.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [orders, searchTerm, statusFilter],
  );

  const stats = useMemo(
    () => ({
      total: orders.length,
      draft: orders.filter((o) => o.status === "Draft").length,
      confirmed: orders.filter((o) => o.status === "Confirmed").length,
      planning: orders.filter((o) => o.status === "PLANNING").length,
      scheduled: orders.filter((o) => o.status === "SCHEDULED").length,
      inProduction: orders.filter((o) => o.status === "In Production").length,
      stopped: orders.filter((o) => o.status === "STOPPED").length,
      completed: orders.filter((o) => o.status === "Completed").length,
      cancelled: orders.filter((o) => o.status === "Cancelled").length,
    }),
    [orders],
  );

  /* --- form helpers --- */
  const resetForm = () => {
    setFormData({
      customerName: "",
      productType: "",
      quantity: "",
      deadline: "",
      priority: "Medium",
      items: [],
    });
    setPendingFiles([]);
  };
  const addItem = () =>
    setFormData({
      ...formData,
      items: [...formData.items, { productName: "", quantity: "", price: "" }],
    });
  const removeItem = (i) =>
    setFormData({
      ...formData,
      items: formData.items.filter((_, idx) => idx !== i),
    });
  const updateItem = (i, field, val) => {
    const items = [...formData.items];
    items[i] = { ...items[i], [field]: val };
    setFormData({ ...formData, items });
  };
  const setField = (field, val) => setFormData((p) => ({ ...p, [field]: val }));

  const buildOrderPayload = () => ({
    customerName: formData.customerName,
    productType: formData.productType,
    quantity: parseInt(formData.quantity),
    deadline: formData.deadline
      ? new Date(formData.deadline).toISOString()
      : null,
    priority: formData.priority,
    items: formData.items
      .filter((it) => it.productName && it.quantity)
      .map((it) => ({
        productName: it.productName,
        quantity: parseInt(it.quantity),
        price: it.price ? parseFloat(it.price) : null,
      })),
  });

  /* --- actions --- */
  const handleCreateOrder = async () => {
    try {
      setActionLoading(true);
      const created = await adminService.createOrder(buildOrderPayload());
      const orderId = created?.id;
      if (orderId && pendingFiles.length > 0) {
        let ok = 0;
        for (const f of pendingFiles) {
          try {
            await adminService.uploadOrderFile(orderId, f);
            ok++;
          } catch (e) {
            console.error(e);
          }
        }
        alert(
          ok < pendingFiles.length
            ? `Order created! Files uploaded: ${ok}/${pendingFiles.length}`
            : `Order created with ${ok} files!`,
        );
      } else {
        alert("Order created successfully!");
      }
      setShowCreateModal(false);
      resetForm();
      fetchOrders();
    } catch (err) {
      console.error("Error creating order:", err);
      alert(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to create order",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmOrder = async (id) => {
    try {
      setActionLoading(true);
      await adminService.confirmOrder(id);
      fetchOrders();
    } catch (e) {
      alert(e.response?.data?.message || "Failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = (id) => {
    setConfirmAction({ type: "cancel", orderId: id });
    setShowConfirmModal(true);
  };
  const handleDeleteOrder = (id) => {
    setConfirmAction({ type: "delete", orderId: id });
    setShowConfirmModal(true);
  };
  const handleStopOrder = (id) => {
    setConfirmAction({ type: "stop", orderId: id });
    setShowConfirmModal(true);
  };
  const handleResumeOrder = (id) => {
    setConfirmAction({ type: "resume", orderId: id });
    setShowConfirmModal(true);
  };

  const executeConfirmAction = async () => {
    const { type, orderId } = confirmAction;
    try {
      setActionLoading(true);
      if (type === "cancel") {
        await adminService.cancelOrder(orderId);
      } else if (type === "delete") {
        await adminService.deleteOrder(orderId);
      } else if (type === "stop") {
        await adminService.stopOrder(orderId);
      } else if (type === "resume") {
        await adminService.resumeOrder(orderId);
      }
      fetchOrders();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.response?.data ||
          `Failed to ${type} order`,
      );
    } finally {
      setActionLoading(false);
      setShowConfirmModal(false);
      setConfirmAction({ type: "", orderId: null });
    }
  };

  const handleEditOrder = (order) => {
    if (!["Draft", "Confirmed"].includes(order.status)) {
      alert("Only Draft / Confirmed orders can be edited.");
      return;
    }
    setEditingOrder(order);
    setFormData({
      customerName: order.customerName,
      productType: order.productType,
      quantity: order.quantity?.toString() || "",
      deadline: order.deadline ? order.deadline.split("T")[0] : "",
      priority: order.priority || "Medium",
      items: (order.items || []).map((it) => ({
        productName: it.productName || "",
        quantity: it.quantity?.toString() || "",
        price: it.price?.toString() || "",
      })),
    });
    setPendingFiles([]);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      setActionLoading(true);
      await adminService.updateOrder(editingOrder.id, buildOrderPayload());
      if (pendingFiles.length > 0) {
        let ok = 0;
        for (const f of pendingFiles) {
          try {
            await adminService.uploadOrderFile(editingOrder.id, f);
            ok++;
          } catch (e) {
            console.error(e);
          }
        }
        if (ok < pendingFiles.length) {
          alert(`Order updated! Files uploaded: ${ok}/${pendingFiles.length}`);
        }
      }
      setShowEditModal(false);
      setEditingOrder(null);
      resetForm();
      fetchOrders();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to update order",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const detail = await adminService.getOrderById(id);
      setDetailOrder(detail);
      try {
        const files = await adminService.getOrderFiles(id);
        setUploadedFiles(Array.isArray(files) ? files : []);
      } catch {
        setUploadedFiles([]);
      }
      setShowDetailModal(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load order details");
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !detailOrder) return;
    setUploadLoading(true);
    const results = [];
    for (const f of files) {
      try {
        results.push(await adminService.uploadOrderFile(detailOrder.id, f));
      } catch (err) {
        console.error(err);
      }
    }
    if (results.length > 0) {
      setUploadedFiles((p) => [...p, ...results]);
    }
    setUploadLoading(false);
    e.target.value = null;
  };

  /* --- confirm config --- */
  const confirmConfig = useMemo(() => {
    switch (confirmAction.type) {
      case "cancel":
        return {
          icon: "⚠️",
          cls: "warning",
          title: "Cancel Order",
          btnCls: "ao-btn-warning",
          btnText: "Yes, Cancel",
        };
      case "delete":
        return {
          icon: "🗑️",
          cls: "danger",
          title: "Delete Order",
          btnCls: "ao-btn-danger",
          btnText: "Yes, Delete",
        };
      case "stop":
        return {
          icon: "⏸️",
          cls: "warning",
          title: "Stop Production",
          btnCls: "ao-btn-warning",
          btnText: "Yes, Stop",
        };
      case "resume":
        return {
          icon: "▶️",
          cls: "info",
          title: "Resume Production",
          btnCls: "ao-btn-save",
          btnText: "Yes, Resume",
        };
      default:
        return {
          icon: "❓",
          cls: "info",
          title: "Confirm",
          btnCls: "ao-btn-save",
          btnText: "Confirm",
        };
    }
  }, [confirmAction.type]);

  const confirmMessage = useMemo(() => {
    const id = confirmAction.orderId;
    switch (confirmAction.type) {
      case "cancel":
        return (
          <>
            Are you sure you want to cancel order <strong>#{id}</strong>? This
            cannot be undone.
          </>
        );
      case "delete":
        return (
          <>
            Permanently delete order <strong>#{id}</strong>? This cannot be
            undone.
          </>
        );
      case "stop":
        return (
          <>
            Stop production for order <strong>#{id}</strong>? Related schedules
            will be stopped.
          </>
        );
      case "resume":
        return (
          <>
            Resume production for order <strong>#{id}</strong>? Stopped
            schedules will restart.
          </>
        );
      default:
        return "Are you sure?";
    }
  }, [confirmAction]);

  /* ==============================
     SHARED SUB-COMPONENTS
     ============================== */

  /* Items form for create/edit modals */
  const ItemsForm = () => (
    <div className="ao-items-section">
      <div className="ao-items-header">
        <span className="ao-items-title">
          Order Items{" "}
          {formData.items.length > 0 && (
            <span className="ao-items-count">{formData.items.length}</span>
          )}
        </span>
        <button type="button" className="ao-btn-add-item" onClick={addItem}>
          {I.plus} Add Item
        </button>
      </div>
      {formData.items.length === 0 && (
        <div className="ao-items-empty">
          No items yet. Click "Add Item" to add products.
        </div>
      )}
      {formData.items.map((item, idx) => (
        <div className="ao-item-row" key={idx}>
          <input
            className="ao-form-input"
            style={{ flex: 2 }}
            placeholder="Product name"
            value={item.productName}
            onChange={(e) => updateItem(idx, "productName", e.target.value)}
          />
          <input
            className="ao-form-input"
            style={{ flex: 1 }}
            type="number"
            placeholder="Qty"
            min="1"
            value={item.quantity}
            onChange={(e) => updateItem(idx, "quantity", e.target.value)}
          />
          <input
            className="ao-form-input"
            style={{ flex: 1 }}
            type="number"
            placeholder="Price"
            min="0"
            step="0.01"
            value={item.price}
            onChange={(e) => updateItem(idx, "price", e.target.value)}
          />
          <button
            type="button"
            className="ao-btn-remove-item"
            onClick={() => removeItem(idx)}
          >
            {I.minus}
          </button>
        </div>
      ))}
    </div>
  );

  /* Order form fields */
  const OrderForm = () => (
    <>
      <div className="ao-form-group">
        <label className="ao-form-label">
          Customer Name <span className="ao-form-required">*</span>
        </label>
        <input
          className="ao-form-input"
          value={formData.customerName}
          onChange={(e) => setField("customerName", e.target.value)}
          placeholder="Enter customer name"
        />
      </div>
      <div className="ao-form-group">
        <label className="ao-form-label">
          Product Type <span className="ao-form-required">*</span>
        </label>
        <input
          className="ao-form-input"
          value={formData.productType}
          onChange={(e) => setField("productType", e.target.value)}
          placeholder="Enter product type"
        />
      </div>
      <div className="ao-form-row">
        <div className="ao-form-group">
          <label className="ao-form-label">
            Quantity <span className="ao-form-required">*</span>
          </label>
          <input
            className="ao-form-input"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setField("quantity", e.target.value)}
            placeholder="Enter quantity"
          />
        </div>
        <div className="ao-form-group">
          <label className="ao-form-label">Deadline</label>
          <input
            className="ao-form-input"
            type="date"
            value={formData.deadline}
            onChange={(e) => setField("deadline", e.target.value)}
          />
        </div>
      </div>
      <div className="ao-form-group">
        <label className="ao-form-label">Priority</label>
        <select
          className="ao-form-select"
          value={formData.priority}
          onChange={(e) => setField("priority", e.target.value)}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>
      </div>
      {ItemsForm()}
    </>
  );

  /* ==============================
     LOADING SCREEN
     ============================== */ if (initialLoad && loading) {
    return (
      <div className="admin-container">
        <AdminSidebar />
        <div className="admin-main">
          <PageLoading variant="fullpage" text="Loading orders..." />
        </div>
      </div>
    );
  }

  /* ==============================
     FILTER CHIP DATA
     ============================== */
  const filterChips = [
    { label: "All", value: "All", count: stats.total },
    { label: "Draft", value: "Draft", count: stats.draft },
    { label: "Confirmed", value: "Confirmed", count: stats.confirmed },
    { label: "Planning", value: "PLANNING", count: stats.planning },
    { label: "Scheduled", value: "SCHEDULED", count: stats.scheduled },
    {
      label: "In Production",
      value: "In Production",
      count: stats.inProduction,
    },
    { label: "Stopped", value: "STOPPED", count: stats.stopped },
    { label: "Completed", value: "Completed", count: stats.completed },
    { label: "Cancelled", value: "Cancelled", count: stats.cancelled },
  ];

  /* ==============================
     MAIN RENDER
     ============================== */
  return (
    <div className="admin-container">
      <AdminSidebar />

      <div className="admin-main">
        {/* ── Header ── */}
        <header className="dash-header">
          <div className="dash-header-left">
            <div className="dash-header-avatar">
              {(currentUser?.fullName || "A").charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="dash-title">Order Management</h1>
              <p className="dash-subtitle">
                Track and manage production orders
              </p>
            </div>
          </div>
          <div className="dash-header-right">
            <button
              className="dash-refresh-btn"
              onClick={fetchOrders}
              title="Refresh"
            >
              {I.refresh}
            </button>
            <NotificationBell />
          </div>
        </header>

        {/* ── Content ── */}
        <div className="ao-content">
          {/* Error */}
          {error && (
            <div className="ao-error-banner">
              <div className="ao-error-content">
                <div className="ao-error-icon">⚠️</div>
                <span>{error}</span>
              </div>
              <button className="ao-error-retry" onClick={fetchOrders}>
                Retry
              </button>
            </div>
          )}

          {/* ── Summary Strip (4 compact cards) ── */}
          <div className="ao-summary-strip">
            {/* Total */}
            <div className="ao-summary-card">
              <div className="ao-summary-icon total">{I.layers}</div>
              <div className="ao-summary-info">
                <div className="ao-summary-number">{stats.total}</div>
                <div className="ao-summary-label">Total Orders</div>
              </div>
            </div>

            {/* Active */}
            <div className="ao-summary-card">
              <div className="ao-summary-icon active">{I.zap}</div>
              <div className="ao-summary-info">
                <div className="ao-summary-number">
                  {stats.draft +
                    stats.confirmed +
                    stats.planning +
                    stats.scheduled +
                    stats.inProduction}
                </div>
                <div className="ao-summary-label">Active</div>
                <div className="ao-summary-breakdown">
                  <span className="ao-summary-tag">
                    <span className="ao-summary-tag-dot draft" />
                    {stats.draft} Draft
                  </span>
                  <span className="ao-summary-tag">
                    <span className="ao-summary-tag-dot confirmed" />
                    {stats.confirmed} Confirmed
                  </span>
                  <span className="ao-summary-tag">
                    <span className="ao-summary-tag-dot planning" />
                    {stats.planning} Planning
                  </span>
                  <span className="ao-summary-tag">
                    <span className="ao-summary-tag-dot scheduled" />
                    {stats.scheduled} Scheduled
                  </span>
                  <span className="ao-summary-tag">
                    <span className="ao-summary-tag-dot production" />
                    {stats.inProduction} Production
                  </span>
                </div>
              </div>
            </div>

            {/* Completed */}
            <div className="ao-summary-card">
              <div className="ao-summary-icon completed">{I.checkCircle}</div>
              <div className="ao-summary-info">
                <div className="ao-summary-number">{stats.completed}</div>
                <div className="ao-summary-label">Completed</div>
              </div>
            </div>

            {/* Issues */}
            <div className="ao-summary-card">
              <div className="ao-summary-icon issues">{I.alertTriangle}</div>
              <div className="ao-summary-info">
                <div className="ao-summary-number">
                  {stats.stopped + stats.cancelled}
                </div>
                <div className="ao-summary-label">Issues</div>
                <div className="ao-summary-breakdown">
                  <span className="ao-summary-tag">
                    <span className="ao-summary-tag-dot stopped" />
                    {stats.stopped} Stopped
                  </span>
                  <span className="ao-summary-tag">
                    <span className="ao-summary-tag-dot cancelled" />
                    {stats.cancelled} Cancelled
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Toolbar ── */}
          <div className="ao-toolbar">
            <div className="ao-toolbar-top">
              <div className="ao-search-box">
                <span className="ao-search-icon">{I.search}</span>
                <input
                  ref={searchRef}
                  className="ao-search-input"
                  placeholder="Search by customer, product, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <kbd className="ao-search-shortcut">/</kbd>
              </div>
              <button
                className="ao-btn-create"
                onClick={() => setShowCreateModal(true)}
                title="New Order (N)"
              >
                {I.plus} New Order
              </button>
            </div>
            <div className="ao-filter-chips">
              {filterChips.map((chip) => (
                <button
                  key={chip.value}
                  className={`ao-chip${statusFilter === chip.value ? " active" : ""}`}
                  onClick={() => setStatusFilter(chip.value)}
                >
                  {chip.label}
                  {chip.count > 0 && (
                    <span className="ao-chip-count">{chip.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Order List ── */}
          {filteredOrders.length === 0 ? (
            <div className="ao-empty-state">
              <div className="ao-empty-icon">{I.package}</div>
              <p className="ao-empty-title">No orders found</p>
              <p className="ao-empty-desc">
                {searchTerm || statusFilter !== "All"
                  ? "Try adjusting your search or filter."
                  : "Create your first order to get started."}
              </p>
            </div>
          ) : (
            <div className="ao-order-list">
              {/* List Header */}
              <div className="ao-order-list-header">
                <span>ID</span>
                <span>Order</span>
                <span>Quantity</span>
                <span>Deadline</span>
                <span>Priority</span>
                <span>Status</span>
                <span style={{ textAlign: "right" }}>Actions</span>
              </div>

              {/* Order Cards */}
              {filteredOrders.map((order) => (
                <div className="ao-order-card" key={order.id}>
                  <span className="ao-order-id">#{order.id}</span>

                  <div className="ao-order-main">
                    <span className="ao-order-customer">
                      {order.customerName}
                    </span>
                    <span className="ao-order-product">
                      {order.productType}
                    </span>
                    <div className="ao-order-meta-inline">
                      <span>{order.createdByName || "—"}</span>
                      <span className="ao-order-meta-sep" />
                      <span>{formatDate(order.createdAt)}</span>
                      {order.totalPrice != null && (
                        <>
                          <span className="ao-order-meta-sep" />
                          <span>{formatCurrency(order.totalPrice)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <span className="ao-order-qty">
                    {order.quantity?.toLocaleString()}
                  </span>

                  <span className="ao-order-deadline">
                    {formatDate(order.deadline)}
                  </span>

                  <span
                    className={`ao-priority ${getPriorityKey(order.priority)}`}
                  >
                    {order.priority}
                  </span>

                  <span className={`ao-status ${getStatusKey(order.status)}`}>
                    <span className="ao-status-dot" />
                    {getStatusDisplay(order.status)}
                  </span>

                  <div className="ao-actions">
                    <button
                      className="ao-action-btn view"
                      onClick={() => handleViewDetail(order.id)}
                      disabled={actionLoading}
                      title="View"
                    >
                      {I.eye}
                    </button>
                    {["Draft", "Confirmed"].includes(order.status) && (
                      <button
                        className="ao-action-btn edit"
                        onClick={() => handleEditOrder(order)}
                        disabled={actionLoading}
                        title="Edit"
                      >
                        {I.edit}
                      </button>
                    )}
                    {order.status === "Draft" && (
                      <button
                        className="ao-action-btn confirm"
                        onClick={() => handleConfirmOrder(order.id)}
                        disabled={actionLoading}
                        title="Confirm"
                      >
                        {I.check}
                      </button>
                    )}
                    {order.status === "In Production" && (
                      <button
                        className="ao-action-btn stop"
                        onClick={() => handleStopOrder(order.id)}
                        disabled={actionLoading}
                        title="Stop"
                      >
                        {I.stop}
                      </button>
                    )}
                    {order.status === "STOPPED" && (
                      <button
                        className="ao-action-btn resume"
                        onClick={() => handleResumeOrder(order.id)}
                        disabled={actionLoading}
                        title="Resume"
                      >
                        {I.rotateCw}
                      </button>
                    )}
                    {![
                      "Completed",
                      "Cancelled",
                      "STOPPED",
                      "PLANNING",
                      "SCHEDULED",
                      "In Production",
                    ].includes(order.status) && (
                      <button
                        className="ao-action-btn cancel"
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={actionLoading}
                        title="Cancel"
                      >
                        {I.xCircle}
                      </button>
                    )}
                    {["Draft", "Cancelled"].includes(order.status) && (
                      <button
                        className="ao-action-btn delete"
                        onClick={() => handleDeleteOrder(order.id)}
                        disabled={actionLoading}
                        title="Delete"
                      >
                        {I.trash}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* List Footer */}
              <div className="ao-list-footer">
                <span className="ao-list-count">
                  Showing <strong>{filteredOrders.length}</strong> of{" "}
                  <strong>{orders.length}</strong> orders
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================================
          CREATE ORDER MODAL
          ================================ */}
      {showCreateModal && (
        <div className="ao-modal-overlay">
          <div className="ao-modal large">
            <div className="ao-modal-header">
              <div className="ao-modal-header-left">
                <div className="ao-modal-icon create">{I.plus}</div>
                <div>
                  <h2 className="ao-modal-title">Create New Order</h2>
                  <p className="ao-modal-subtitle">
                    Fill in order details below
                  </p>
                </div>
              </div>
              <button
                className="ao-modal-close"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                {I.close}
              </button>
            </div>
            <div className="ao-modal-body">
              {OrderForm()}

              {/* File Upload */}
              <div className="ao-form-group">
                <label className="ao-form-label">Attachments (SOP / BOM)</label>
                <div
                  className="ao-upload-area"
                  onClick={() =>
                    document.getElementById("ao-create-files").click()
                  }
                >
                  <span className="ao-upload-area-icon">{I.upload}</span>
                  <span className="ao-upload-area-text">
                    Click to select files
                  </span>
                  <span className="ao-upload-area-hint">
                    SOP, BOM, drawings, specs…
                  </span>
                  <input
                    id="ao-create-files"
                    type="file"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = Array.from(e.target.files);
                      if (f.length) setPendingFiles((p) => [...p, ...f]);
                      e.target.value = null;
                    }}
                  />
                </div>
                {pendingFiles.length > 0 && (
                  <div className="ao-file-list" style={{ marginTop: 10 }}>
                    {pendingFiles.map((f, i) => (
                      <div className="ao-file-item" key={i}>
                        <div className="ao-file-icon">{I.file}</div>
                        <div className="ao-file-info">
                          <span className="ao-file-name">{f.name}</span>
                          <span className="ao-file-meta">
                            {(f.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <button
                          className="ao-file-remove"
                          onClick={() =>
                            setPendingFiles((p) =>
                              p.filter((_, idx) => idx !== i),
                            )
                          }
                        >
                          {I.minus}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="ao-modal-footer">
              <button
                className="ao-btn-cancel"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="ao-btn-save"
                onClick={handleCreateOrder}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <span className="ao-spinner-sm" />
                    Creating...
                  </>
                ) : (
                  "Create Order"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================
          EDIT ORDER MODAL
          ================================ */}
      {showEditModal && (
        <div className="ao-modal-overlay">
          <div className="ao-modal large">
            <div className="ao-modal-header">
              <div className="ao-modal-header-left">
                <div className="ao-modal-icon edit">{I.edit}</div>
                <div>
                  <h2 className="ao-modal-title">
                    Edit Order #{editingOrder?.id}
                  </h2>
                  <p className="ao-modal-subtitle">Modify order details</p>
                </div>
              </div>
              <button
                className="ao-modal-close"
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                {I.close}
              </button>
            </div>
            <div className="ao-modal-body">
              {OrderForm()}

              {/* File Upload */}
              <div className="ao-form-group">
                <label className="ao-form-label">Attachments (SOP / BOM)</label>
                <div
                  className="ao-upload-area"
                  onClick={() =>
                    document.getElementById("ao-edit-files").click()
                  }
                >
                  <span className="ao-upload-area-icon">{I.upload}</span>
                  <span className="ao-upload-area-text">
                    Click to select files
                  </span>
                  <span className="ao-upload-area-hint">
                    SOP, BOM, drawings, specs…
                  </span>
                  <input
                    id="ao-edit-files"
                    type="file"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = Array.from(e.target.files);
                      if (f.length) setPendingFiles((p) => [...p, ...f]);
                      e.target.value = null;
                    }}
                  />
                </div>
                {pendingFiles.length > 0 && (
                  <div className="ao-file-list" style={{ marginTop: 10 }}>
                    {pendingFiles.map((f, i) => (
                      <div className="ao-file-item" key={i}>
                        <div className="ao-file-icon">{I.file}</div>
                        <div className="ao-file-info">
                          <span className="ao-file-name">{f.name}</span>
                          <span className="ao-file-meta">
                            {(f.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <button
                          className="ao-file-remove"
                          onClick={() =>
                            setPendingFiles((p) =>
                              p.filter((_, idx) => idx !== i),
                            )
                          }
                        >
                          {I.minus}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="ao-modal-footer">
              <button
                className="ao-btn-cancel"
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="ao-btn-save"
                onClick={handleSaveEdit}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <span className="ao-spinner-sm" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================
          DETAIL ORDER – SLIDE-OVER PANEL
          ================================ */}
      {showDetailModal && detailOrder && (
        <div
          className="ao-slideover-overlay"
          onClick={() => setShowDetailModal(false)}
        >
          <div className="ao-slideover" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="ao-slideover-header">
              <div className="ao-slideover-header-left">
                <div className="ao-slideover-icon">{I.package}</div>
                <div className="ao-slideover-title-group">
                  <h2 className="ao-slideover-title">
                    Order #{detailOrder.id}
                  </h2>
                  <p className="ao-slideover-subtitle">
                    {detailOrder.customerName} — {detailOrder.productType}
                  </p>
                </div>
              </div>
              <button
                className="ao-slideover-close"
                onClick={() => setShowDetailModal(false)}
                title="Close (Esc)"
              >
                {I.close}
              </button>
            </div>

            {/* Body */}
            <div className="ao-slideover-body">
              {/* Progress Timeline */}
              {!["Cancelled"].includes(detailOrder.status) && (
                <div className="ao-timeline">
                  {TIMELINE_STEPS.map((step, idx) => {
                    const state = getTimelineState(detailOrder.status, step);
                    return (
                      <React.Fragment key={step}>
                        {idx > 0 && (
                          <div
                            className={`ao-timeline-line${getTimelineState(detailOrder.status, TIMELINE_STEPS[idx - 1]) === "done" && (state === "done" || state === "current") ? " done" : ""}`}
                          />
                        )}
                        <div className={`ao-timeline-step ${state}`}>
                          <div className="ao-timeline-dot">
                            {state === "done" && I.checkSmall}
                          </div>
                          <span className="ao-timeline-label">{step}</span>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}

              {detailOrder.status === "Cancelled" && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "12px 0 20px",
                    color: "#9ca3af",
                    fontSize: 13,
                  }}
                >
                  This order has been cancelled.
                </div>
              )}

              {detailOrder.status === "STOPPED" && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "0 0 8px",
                    color: "#ef4444",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  ⚠ Production stopped
                </div>
              )}

              {/* Info Grid */}
              <div className="ao-detail-grid">
                <div className="ao-detail-item">
                  <span className="ao-detail-label">Customer</span>
                  <span className="ao-detail-value">
                    {detailOrder.customerName}
                  </span>
                </div>
                <div className="ao-detail-item">
                  <span className="ao-detail-label">Product Type</span>
                  <span className="ao-detail-value">
                    {detailOrder.productType}
                  </span>
                </div>
                <div className="ao-detail-item">
                  <span className="ao-detail-label">Quantity</span>
                  <span className="ao-detail-value">
                    {detailOrder.quantity?.toLocaleString()}
                  </span>
                </div>
                <div className="ao-detail-item">
                  <span className="ao-detail-label">Deadline</span>
                  <span className="ao-detail-value">
                    {formatDate(detailOrder.deadline)}
                  </span>
                </div>
                <div className="ao-detail-item">
                  <span className="ao-detail-label">Priority</span>
                  <span
                    className={`ao-priority ${getPriorityKey(detailOrder.priority)}`}
                  >
                    {detailOrder.priority}
                  </span>
                </div>
                <div className="ao-detail-item">
                  <span className="ao-detail-label">Status</span>
                  <span
                    className={`ao-status ${getStatusKey(detailOrder.status)}`}
                  >
                    <span className="ao-status-dot" />
                    {getStatusDisplay(detailOrder.status)}
                  </span>
                </div>
                <div className="ao-detail-item">
                  <span className="ao-detail-label">Created By</span>
                  <span className="ao-detail-value">
                    {detailOrder.createdByName || "—"}
                  </span>
                </div>
                <div className="ao-detail-item">
                  <span className="ao-detail-label">Total Price</span>
                  <span className="ao-detail-value">
                    {detailOrder.totalPrice != null
                      ? formatCurrency(detailOrder.totalPrice)
                      : "—"}
                  </span>
                </div>
                <div className="ao-detail-item">
                  <span className="ao-detail-label">Created</span>
                  <span className="ao-detail-value">
                    {formatDate(detailOrder.createdAt)}
                  </span>
                </div>
                <div className="ao-detail-item">
                  <span className="ao-detail-label">Updated</span>
                  <span className="ao-detail-value">
                    {formatDate(detailOrder.updatedAt)}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              {detailOrder.items && detailOrder.items.length > 0 && (
                <div className="ao-detail-section">
                  <h3 className="ao-detail-section-title">
                    <div className="ao-detail-section-icon">{I.package}</div>{" "}
                    Order Items ({detailOrder.items.length})
                  </h3>
                  <table className="ao-items-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailOrder.items.map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td>{idx + 1}</td>
                          <td>{it.productName}</td>
                          <td>{it.quantity?.toLocaleString()}</td>
                          <td>{formatCurrency(it.price)}</td>
                          <td>
                            {formatCurrency(
                              (it.quantity || 0) * (it.price || 0),
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Files */}
              <div className="ao-detail-section">
                <h3 className="ao-detail-section-title">
                  <div className="ao-detail-section-icon">{I.file}</div> Files
                  (SOP / BOM)
                </h3>
                {uploadedFiles.length > 0 && (
                  <div className="ao-file-list">
                    {uploadedFiles.map((f, i) => (
                      <div className="ao-file-item" key={f.id || i}>
                        <div className="ao-file-icon">{I.file}</div>
                        <div className="ao-file-info">
                          <a
                            className="ao-file-name"
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {f.fileName}
                          </a>
                          <span className="ao-file-meta">
                            Uploaded:{" "}
                            {f.uploadedAt
                              ? new Date(f.uploadedAt).toLocaleString("en-US")
                              : "—"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {uploadedFiles.length === 0 && (
                  <p className="ao-items-empty">
                    No files uploaded yet. Use the area below to attach files.
                  </p>
                )}
                <div
                  className="ao-upload-area"
                  style={{ marginTop: 12 }}
                  onClick={() =>
                    document.getElementById("ao-detail-files").click()
                  }
                >
                  <span className="ao-upload-area-icon">{I.upload}</span>
                  <span className="ao-upload-area-text">
                    {uploadLoading ? "Uploading..." : "Click to upload files"}
                  </span>
                  <span className="ao-upload-area-hint">
                    SOP, BOM, drawings, specs…
                  </span>
                  <input
                    id="ao-detail-files"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    disabled={uploadLoading}
                    style={{ display: "none" }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="ao-slideover-footer">
              <button
                className="ao-btn-cancel"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================
          CONFIRM ACTION MODAL
          ================================ */}
      {showConfirmModal && (
        <div className="ao-modal-overlay">
          <div className="ao-modal confirm-modal">
            <div className="ao-modal-header">
              <div className="ao-modal-header-left">
                <div className={`ao-modal-icon ${confirmConfig.cls}`}>
                  {confirmConfig.icon}
                </div>
                <h2 className="ao-modal-title">{confirmConfig.title}</h2>
              </div>
              <button
                className="ao-modal-close"
                onClick={() => setShowConfirmModal(false)}
              >
                {I.close}
              </button>
            </div>
            <div className="ao-modal-body">
              <div className="ao-confirm-body">
                <p className="ao-confirm-message">{confirmMessage}</p>
              </div>
            </div>
            <div className="ao-modal-footer center">
              <button
                className="ao-btn-cancel"
                onClick={() => setShowConfirmModal(false)}
                disabled={actionLoading}
              >
                No, Go Back
              </button>
              <button
                className={confirmConfig.btnCls}
                onClick={executeConfirmAction}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <span className="ao-spinner-sm" />
                    Processing...
                  </>
                ) : (
                  confirmConfig.btnText
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
