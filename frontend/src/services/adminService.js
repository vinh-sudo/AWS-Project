import { api } from "./authService";

// Uses the shared axios instance from authService which:
// - Automatically injects Authorization header from localStorage
// - Handles 401/403 responses (clears session & redirects to login)
// - Uses correct base URL (localhost:8080)

// ==================== ORDER MANAGEMENT ====================

/**
 * Get all orders
 */
const getAllOrders = async () => {
  const response = await api.get("/api/admin/orders");
  return response.data;
};

/**
 * Get order by ID
 */
const getOrderById = async (id) => {
  const response = await api.get(`/api/admin/orders/${id}`);
  return response.data;
};

/**
 * Create new order
 */
const createOrder = async (orderData) => {
  const response = await api.post("/api/admin/orders", orderData);
  return response.data;
};

/**
 * Update order
 */
const updateOrder = async (id, orderData) => {
  const response = await api.put(`/api/admin/orders/${id}`, orderData);
  return response.data;
};

/**
 * Delete order
 */
const deleteOrder = async (id) => {
  const response = await api.delete(`/api/admin/orders/${id}`);
  return response.data;
};

/**
 * Confirm order (Draft -> Confirmed)
 */
const confirmOrder = async (id) => {
  const response = await api.post(`/api/admin/orders/${id}/confirm`, {});
  return response.data;
};

/**
 * Start production (Confirmed -> In Production)
 */
const startProduction = async (id) => {
  const response = await api.post(
    `/api/admin/orders/${id}/start-production`,
    {},
  );
  return response.data;
};

/**
 * Complete order (In Production -> Completed)
 */
const completeOrder = async (id) => {
  const response = await api.post(`/api/admin/orders/${id}/complete`, {});
  return response.data;
};

/**
 * Cancel order
 */
const cancelOrder = async (id, reason = null) => {
  const response = await api.post(`/api/admin/orders/${id}/cancel`, {
    reason,
  });
  return response.data;
};

/**
 * Stop order production
 */
const stopOrder = async (orderId) => {
  const response = await api.post(`/api/admin/orders/${orderId}/stop`, {});
  return response.data;
};

/**
 * Resume order production
 */
const resumeOrder = async (orderId) => {
  const response = await api.post(`/api/admin/orders/${orderId}/resume`, {});
  return response.data;
};

/**
 * Get orders by status
 */
const getOrdersByStatus = async (status) => {
  const response = await api.get(`/api/admin/orders/status/${status}`);
  return response.data;
};

/**
 * Get orders by priority
 */
const getOrdersByPriority = async (priority) => {
  const response = await api.get(`/api/admin/orders/priority/${priority}`);
  return response.data;
};

/**
 * Search orders
 */
const searchOrders = async (params) => {
  const response = await api.get("/api/admin/orders/search", { params });
  return response.data;
};

/**
 * Get upcoming deadline orders
 */
const getUpcomingDeadlineOrders = async (days = 7) => {
  const response = await api.get("/api/admin/orders/upcoming-deadline", {
    params: { days },
  });
  return response.data;
};

/**
 * Get my orders (current admin's orders)
 */
const getMyOrders = async () => {
  const response = await api.get("/api/admin/orders/my-orders");
  return response.data;
};

// ==================== FILE UPLOAD ====================

/**
 * Upload file(s) for an order
 * POST /api/upload/admin/order/{orderId}/files
 * @param {number} orderId
 * @param {File} file - the file to upload
 * @returns {Promise<ProductionFileResponse>}
 */
const uploadOrderFile = async (orderId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post(
    `/api/upload/admin/order/${orderId}/files`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
};

// ==================== AUDIT LOG ====================
// NOTE: Backend chưa có endpoint /api/admin/audit-logs.
// Khi backend tạo endpoint này, uncomment và sửa lại.

const getAuditLogs = async () => [];
const getAuditLogsByUser = async (/* userId */) => [];
const getAuditLogsByAction = async (/* actionType */) => [];
const getAuditLogsByEntity = async (/* entity */) => [];

// ==================== USER MANAGEMENT ====================
// NOTE: Backend chưa có endpoint /api/admin/users.
// Khi backend tạo endpoint này, uncomment và sửa lại.

const getAllUsers = async () => [];
const getUserById = async (/* id */) => null;
const createUser = async (/* userData */) => null;
const updateUser = async (/* id, userData */) => null;
const deleteUser = async (/* id */) => null;
const updateUserStatus = async (/* id, status */) => null;
const getUsersByRole = async (/* role */) => [];

// ==================== DASHBOARD STATS ====================

/**
 * Get dashboard statistics (aggregated from multiple sources)
 */
const getDashboardStats = async () => {
  try {
    // Only /api/admin/orders exists in backend.
    // /api/admin/users and /api/admin/audit-logs do NOT exist yet.
    const ordersResponse = await api
      .get("/api/admin/orders")
      .catch(() => ({ data: [] }));

    const orders = ordersResponse.data || [];

    return {
      totalUsers: 0,
      activeUsers: 0,
      blockedUsers: 0,
      totalOrders: orders.length,
      pendingOrders: orders.filter(
        (o) => o.status === "DRAFT" || o.status === "CONFIRMED",
      ).length,
      completedOrders: orders.filter((o) => o.status === "COMPLETED").length,
      inProgressOrders: orders.filter((o) => o.status === "IN_PRODUCTION")
        .length,
      cancelledOrders: orders.filter((o) => o.status === "CANCELLED").length,
      recentActivities: [],
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

const adminService = {
  // Orders
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  confirmOrder,
  startProduction,
  completeOrder,
  cancelOrder,
  stopOrder,
  resumeOrder,
  getOrdersByStatus,
  getOrdersByPriority,
  searchOrders,
  getUpcomingDeadlineOrders,
  getMyOrders,
  // File Upload
  uploadOrderFile,
  // Audit Logs
  getAuditLogs,
  getAuditLogsByUser,
  getAuditLogsByAction,
  getAuditLogsByEntity,
  // Users
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  getUsersByRole,
  // Dashboard
  getDashboardStats,
};

export default adminService;
