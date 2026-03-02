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

// ==================== ADMIN STATISTICS ====================

/**
 * Get order overview (count by status)
 * GET /api/admin/statistics/order-overview
 * @returns {Promise<{totalOrders: number, countByStatus: Object}>}
 */
const getOrderOverview = async () => {
  const response = await api.get("/api/admin/statistics/order-overview");
  return response.data;
};

/**
 * Get order trend over a date range
 * GET /api/admin/statistics/order-trend
 * @param {string} from - ISO date (YYYY-MM-DD)
 * @param {string} to - ISO date (YYYY-MM-DD)
 * @param {string} groupBy - 'day' | 'week' | 'month'
 */
const getOrderTrend = async (from, to, groupBy = "day") => {
  const response = await api.get("/api/admin/statistics/order-trend", {
    params: { from, to, groupBy },
  });
  return response.data;
};

/**
 * Get revenue summary for a date range
 * GET /api/admin/statistics/revenue-summary
 */
const getRevenueSummary = async (from, to) => {
  const response = await api.get("/api/admin/statistics/revenue-summary", {
    params: { from, to },
  });
  return response.data;
};

/**
 * Get system overview (users, lines, machines counts)
 * GET /api/admin/statistics/system-overview
 * @returns {Promise<{totalUsers, activeUsers, totalEmployees, totalLines, activeLines, totalMachines, activeMachines}>}
 */
const getSystemOverview = async () => {
  const response = await api.get("/api/admin/statistics/system-overview");
  return response.data;
};

// ==================== DASHBOARD STATS ====================

/**
 * Get dashboard statistics (aggregated from real statistics endpoints)
 */
const getDashboardStats = async () => {
  try {
    const [orderOverview, systemOverview] = await Promise.all([
      api
        .get("/api/admin/statistics/order-overview")
        .catch(() => ({ data: null })),
      api
        .get("/api/admin/statistics/system-overview")
        .catch(() => ({ data: null })),
    ]);

    const orderData = orderOverview.data;
    const sysData = systemOverview.data;

    const countByStatus = orderData?.countByStatus || {};

    return {
      totalUsers: sysData?.totalUsers || 0,
      activeUsers: sysData?.activeUsers || 0,
      blockedUsers: Math.max(
        0,
        (sysData?.totalUsers || 0) - (sysData?.activeUsers || 0),
      ),
      totalOrders: orderData?.totalOrders || 0,
      pendingOrders:
        (countByStatus.DRAFT || 0) + (countByStatus.CONFIRMED || 0),
      completedOrders: countByStatus.COMPLETED || 0,
      inProgressOrders: countByStatus.IN_PRODUCTION || 0,
      cancelledOrders: countByStatus.CANCELLED || 0,
      // System info
      totalLines: sysData?.totalLines || 0,
      activeLines: sysData?.activeLines || 0,
      totalMachines: sysData?.totalMachines || 0,
      activeMachines: sysData?.activeMachines || 0,
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
  // Statistics
  getOrderOverview,
  getOrderTrend,
  getRevenueSummary,
  getSystemOverview,
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
