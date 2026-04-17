import { api } from "./authService";

// Uses the shared axios instance from authService which:
// - Automatically injects Authorization header from localStorage
// - Handles 401/403 responses (clears session & redirects to login)
// - Uses the configured API base URL (VITE_API_URL or same-origin in production)

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

/**
 * Get files for an order
 * GET /api/upload/admin/order/{orderId}/files
 * @param {number} orderId
 * @returns {Promise<ProductionFileResponse[]>}
 */
const getOrderFiles = async (orderId) => {
  const response = await api.get(`/api/upload/admin/order/${orderId}/files`);
  return response.data;
};

// ==================== AUDIT LOG ====================
// Backend endpoints:
// - GET /api/admin/audit-logs?page=&size=
// - GET /api/admin/audit-logs/user/{userId}?startDate=&endDate=&page=&size=
// - GET /api/admin/audit-logs/action/{actionType}?since=&page=&size=
// - GET /api/admin/audit-logs/entity/{entity}/{entityId}?page=&size=
// - GET /api/admin/audit-logs/critical?since=&page=&size=

const getAuditLogs = async (params = {}) => {
  const response = await api.get("/api/admin/audit-logs", { params });
  return response.data;
};

const getAuditLogsByUser = async (userId, params = {}) => {
  const response = await api.get(`/api/admin/audit-logs/user/${userId}`, {
    params,
  });
  return response.data;
};

const getAuditLogsByAction = async (actionType, params = {}) => {
  const response = await api.get(`/api/admin/audit-logs/action/${actionType}`, {
    params,
  });
  return response.data;
};

const getAuditLogsByEntity = async (entity, entityId, params = {}) => {
  const response = await api.get(
    `/api/admin/audit-logs/entity/${entity}/${entityId}`,
    { params },
  );
  return response.data;
};

const getCriticalAuditLogs = async (params = {}) => {
  const response = await api.get("/api/admin/audit-logs/critical", { params });
  return response.data;
};

// ==================== USER MANAGEMENT ====================
// Backend endpoints: /api/admin/accounts

/**
 * Get accounts with optional filters (paginated)
 * GET /api/admin/accounts?role=&search=&page=&size=
 * @param {Object} params - { role, search, page, size }
 * @returns {Promise<{content: AccountSummaryResponse[], totalElements, totalPages, number, size}>}
 */
const getAccounts = async (params = {}) => {
  const response = await api.get("/api/admin/accounts", { params });
  return response.data;
};

/**
 * Update account role
 * PUT /api/admin/accounts/{id}/role
 * @param {number} id - Account ID
 * @param {string} role - New role (e.g. "MANAGER", "LINE_LEADER")
 * @returns {Promise<AccountSummaryResponse>}
 */
const updateAccountRole = async (id, role) => {
  const response = await api.put(`/api/admin/accounts/${id}/role`, { role });
  return response.data;
};

/**
 * Lock an account
 * PUT /api/admin/accounts/{id}/lock
 * @param {number} id - Account ID
 * @returns {Promise<AccountSummaryResponse>}
 */
const lockAccount = async (id) => {
  const response = await api.put(`/api/admin/accounts/${id}/lock`);
  return response.data;
};

/**
 * Unlock an account
 * PUT /api/admin/accounts/{id}/unlock
 * @param {number} id - Account ID
 * @returns {Promise<AccountSummaryResponse>}
 */
const unlockAccount = async (id) => {
  const response = await api.put(`/api/admin/accounts/${id}/unlock`);
  return response.data;
};

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

const ORDER_STATUS_CONFIG = [
  { key: "draft", label: "Draft", color: "#f59e0b", aliases: ["DRAFT"] },
  {
    key: "confirmed",
    label: "Confirmed",
    color: "#3b82f6",
    aliases: ["CONFIRMED"],
  },
  {
    key: "planning",
    label: "Planning",
    color: "#a855f7",
    aliases: ["PLANNING"],
  },
  {
    key: "scheduled",
    label: "Scheduled",
    color: "#0ea5e9",
    aliases: ["SCHEDULED", "PARTIALLY_SCHEDULED"],
  },
  {
    key: "inProduction",
    label: "In Production",
    color: "#06b6d4",
    aliases: ["IN_PRODUCTION", "IN_PROGRESS"],
  },
  {
    key: "stopped",
    label: "Stopped",
    color: "#ef4444",
    aliases: ["STOPPED"],
  },
  {
    key: "completed",
    label: "Completed",
    color: "#10b981",
    aliases: ["COMPLETED"],
  },
  {
    key: "cancelled",
    label: "Cancelled",
    color: "#9ca3af",
    aliases: ["CANCELLED", "CANCELED"],
  },
];

const ORDER_STATUS_LOOKUP = ORDER_STATUS_CONFIG.reduce((lookup, status) => {
  status.aliases.forEach((alias) => {
    lookup[alias] = status.key;
  });
  return lookup;
}, {});

const prettifyUnknownStatus = (status) =>
  status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeOrderStatus = (status) =>
  String(status || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

const buildOrderStatusDistribution = (countByStatus = {}) => {
  const totalsByKey = ORDER_STATUS_CONFIG.reduce((acc, status) => {
    acc[status.key] = 0;
    return acc;
  }, {});

  const extrasByNormalizedStatus = {};

  Object.entries(countByStatus).forEach(([rawStatus, rawCount]) => {
    const count = Number(rawCount) || 0;
    if (count <= 0) return;

    const normalized = normalizeOrderStatus(rawStatus);
    const knownKey = ORDER_STATUS_LOOKUP[normalized];

    if (knownKey) {
      totalsByKey[knownKey] += count;
      return;
    }

    if (!extrasByNormalizedStatus[normalized]) {
      extrasByNormalizedStatus[normalized] = {
        key: `other:${normalized}`,
        name: prettifyUnknownStatus(normalized),
        value: 0,
        color: "#64748b",
      };
    }

    extrasByNormalizedStatus[normalized].value += count;
  });

  const knownStatuses = ORDER_STATUS_CONFIG.map((status) => ({
    key: status.key,
    name: status.label,
    value: totalsByKey[status.key],
    color: status.color,
  }));

  return [...knownStatuses, ...Object.values(extrasByNormalizedStatus)];
};

const ACCOUNT_STATUS_PAGE_SIZE = 200;

const getAccountStatusSummary = async () => {
  const firstPage = await getAccounts({ page: 0, size: ACCOUNT_STATUS_PAGE_SIZE });
  const totalPages = Math.max(1, Number(firstPage?.totalPages || 1));
  const pages = [firstPage];

  for (let page = 1; page < totalPages; page += 1) {
    const pageData = await getAccounts({ page, size: ACCOUNT_STATUS_PAGE_SIZE });
    pages.push(pageData);
  }

  const totalUsersFromApi = Number(firstPage?.totalElements);
  let activeUsers = 0;
  let listedUsers = 0;

  pages.forEach((pageData) => {
    const accounts = Array.isArray(pageData?.content) ? pageData.content : [];
    listedUsers += accounts.length;
    activeUsers += accounts.reduce((count, account) => {
      const isActive = String(account?.status || "").toLowerCase() === "active";
      return count + (isActive ? 1 : 0);
    }, 0);
  });

  const totalUsers = Number.isFinite(totalUsersFromApi)
    ? totalUsersFromApi
    : listedUsers;

  return {
    totalUsers,
    activeUsers,
    blockedUsers: Math.max(0, totalUsers - activeUsers),
  };
};

/**
 * Get dashboard statistics (aggregated from real statistics endpoints)
 */
const getDashboardStats = async () => {
  try {
    const [orderOverview, systemOverview, accountStatusSummary] = await Promise.all([
      api
        .get("/api/admin/statistics/order-overview")
        .catch(() => ({ data: null })),
      api
        .get("/api/admin/statistics/system-overview")
        .catch(() => ({ data: null })),
      getAccountStatusSummary().catch(() => null),
    ]);

    const orderData = orderOverview.data;
    const sysData = systemOverview.data;

    const countByStatus = orderData?.countByStatus || {};
    const orderStatusDistribution = buildOrderStatusDistribution(countByStatus);
    const totalsByStatusKey = orderStatusDistribution.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    const totalOrdersFromDistribution = orderStatusDistribution.reduce(
      (sum, item) => sum + item.value,
      0,
    );

    const totalOrders = Number(orderData?.totalOrders ?? totalOrdersFromDistribution) || 0;
    const resolvedTotalUsers =
      accountStatusSummary?.totalUsers ?? Number(sysData?.totalUsers || 0);
    const resolvedActiveUsers =
      accountStatusSummary?.activeUsers ?? Number(sysData?.activeUsers || 0);
    const resolvedBlockedUsers =
      accountStatusSummary?.blockedUsers ??
      Math.max(0, resolvedTotalUsers - resolvedActiveUsers);

    return {
      totalUsers: resolvedTotalUsers,
      activeUsers: resolvedActiveUsers,
      blockedUsers: resolvedBlockedUsers,
      totalOrders,
      pendingOrders:
        (totalsByStatusKey.draft || 0) +
        (totalsByStatusKey.confirmed || 0) +
        (totalsByStatusKey.planning || 0) +
        (totalsByStatusKey.scheduled || 0),
      completedOrders: totalsByStatusKey.completed || 0,
      inProgressOrders:
        (totalsByStatusKey.inProduction || 0) + (totalsByStatusKey.stopped || 0),
      cancelledOrders: totalsByStatusKey.cancelled || 0,
      orderStatusDistribution,
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

// ==================== LEADER-LINE ASSIGNMENTS ====================

const getAssignments = async () => {
  const response = await api.get("/api/admin/assignments");
  return response.data;
};

const getAvailableLeaders = async () => {
  const response = await api.get("/api/admin/assignments/available-leaders");
  return response.data;
};

const assignLeaderToLine = async (assignmentData) => {
  const response = await api.post("/api/admin/assignments", assignmentData);
  return response.data;
};

const unassignLeader = async (assignmentId) => {
  const response = await api.put(
    `/api/admin/assignments/${assignmentId}/unassign`,
  );
  return response.data;
};

const adminService = {
  // Orders
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  confirmOrder,
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
  getOrderFiles,
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
  getCriticalAuditLogs,
  // Accounts (User Management)
  getAccounts,
  updateAccountRole,
  lockAccount,
  unlockAccount,
  // Leader-Line Assignments
  getAssignments,
  getAvailableLeaders,
  assignLeaderToLine,
  unassignLeader,
  // Dashboard
  getDashboardStats,
};

export default adminService;
