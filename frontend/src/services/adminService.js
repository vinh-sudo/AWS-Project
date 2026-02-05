import axios from "axios";

const API_URL = "http://localhost:8082/api";

// Helper function to get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ==================== ORDER MANAGEMENT ====================

/**
 * Get all orders
 */
const getAllOrders = async () => {
  const response = await axios.get(`${API_URL}/admin/orders`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Get order by ID
 */
const getOrderById = async (id) => {
  const response = await axios.get(`${API_URL}/admin/orders/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Create new order
 */
const createOrder = async (orderData) => {
  const response = await axios.post(`${API_URL}/admin/orders`, orderData, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Update order
 */
const updateOrder = async (id, orderData) => {
  const response = await axios.put(`${API_URL}/admin/orders/${id}`, orderData, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Delete order
 */
const deleteOrder = async (id) => {
  const response = await axios.delete(`${API_URL}/admin/orders/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Confirm order (Draft -> Confirmed)
 */
const confirmOrder = async (id) => {
  const response = await axios.post(
    `${API_URL}/admin/orders/${id}/confirm`,
    {},
    {
      headers: getAuthHeader(),
    },
  );
  return response.data;
};

/**
 * Start production (Confirmed -> In Production)
 */
const startProduction = async (id) => {
  const response = await axios.post(
    `${API_URL}/admin/orders/${id}/start-production`,
    {},
    {
      headers: getAuthHeader(),
    },
  );
  return response.data;
};

/**
 * Complete order (In Production -> Completed)
 */
const completeOrder = async (id) => {
  const response = await axios.post(
    `${API_URL}/admin/orders/${id}/complete`,
    {},
    {
      headers: getAuthHeader(),
    },
  );
  return response.data;
};

/**
 * Cancel order
 */
const cancelOrder = async (id, reason = null) => {
  const response = await axios.post(
    `${API_URL}/admin/orders/${id}/cancel`,
    { reason },
    {
      headers: getAuthHeader(),
    },
  );
  return response.data;
};

/**
 * Get orders by status
 */
const getOrdersByStatus = async (status) => {
  const response = await axios.get(`${API_URL}/admin/orders/status/${status}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Get orders by priority
 */
const getOrdersByPriority = async (priority) => {
  const response = await axios.get(
    `${API_URL}/admin/orders/priority/${priority}`,
    {
      headers: getAuthHeader(),
    },
  );
  return response.data;
};

/**
 * Search orders
 */
const searchOrders = async (params) => {
  const response = await axios.get(`${API_URL}/admin/orders/search`, {
    params,
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Get upcoming deadline orders
 */
const getUpcomingDeadlineOrders = async (days = 7) => {
  const response = await axios.get(
    `${API_URL}/admin/orders/upcoming-deadline`,
    {
      params: { days },
      headers: getAuthHeader(),
    },
  );
  return response.data;
};

// ==================== AUDIT LOG ====================

/**
 * Get all audit logs
 */
const getAuditLogs = async () => {
  const response = await axios.get(`${API_URL}/admin/audit-logs`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Get audit logs by user
 */
const getAuditLogsByUser = async (userId) => {
  const response = await axios.get(
    `${API_URL}/admin/audit-logs/user/${userId}`,
    {
      headers: getAuthHeader(),
    },
  );
  return response.data;
};

/**
 * Get audit logs by action type
 */
const getAuditLogsByAction = async (actionType) => {
  const response = await axios.get(
    `${API_URL}/admin/audit-logs/action/${actionType}`,
    {
      headers: getAuthHeader(),
    },
  );
  return response.data;
};

/**
 * Get audit logs by entity
 */
const getAuditLogsByEntity = async (entity) => {
  const response = await axios.get(
    `${API_URL}/admin/audit-logs/entity/${entity}`,
    {
      headers: getAuthHeader(),
    },
  );
  return response.data;
};

// ==================== USER MANAGEMENT ====================

/**
 * Get all users
 */
const getAllUsers = async () => {
  const response = await axios.get(`${API_URL}/admin/users`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Get user by ID
 */
const getUserById = async (id) => {
  const response = await axios.get(`${API_URL}/admin/users/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Create new user
 */
const createUser = async (userData) => {
  const response = await axios.post(`${API_URL}/admin/users`, userData, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Update user
 */
const updateUser = async (id, userData) => {
  const response = await axios.put(`${API_URL}/admin/users/${id}`, userData, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Delete user
 */
const deleteUser = async (id) => {
  const response = await axios.delete(`${API_URL}/admin/users/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Update user status (Active/Blocked)
 */
const updateUserStatus = async (id, status) => {
  const response = await axios.patch(
    `${API_URL}/admin/users/${id}/status`,
    { status },
    {
      headers: getAuthHeader(),
    },
  );
  return response.data;
};

/**
 * Get users by role
 */
const getUsersByRole = async (role) => {
  const response = await axios.get(`${API_URL}/admin/users/role/${role}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// ==================== DASHBOARD STATS ====================

/**
 * Get dashboard statistics (aggregated from multiple sources)
 */
const getDashboardStats = async () => {
  try {
    // Fetch data from multiple endpoints in parallel
    const [ordersResponse, usersResponse, auditLogsResponse] =
      await Promise.all([
        axios
          .get(`${API_URL}/admin/orders`, { headers: getAuthHeader() })
          .catch(() => ({ data: [] })),
        axios
          .get(`${API_URL}/admin/users`, { headers: getAuthHeader() })
          .catch(() => ({ data: [] })),
        axios
          .get(`${API_URL}/admin/audit-logs`, { headers: getAuthHeader() })
          .catch(() => ({ data: [] })),
      ]);

    const orders = ordersResponse.data || [];
    const users = usersResponse.data || [];
    const auditLogs = auditLogsResponse.data || [];

    // Calculate stats
    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === "active").length,
      blockedUsers: users.filter((u) => u.status === "blocked").length,
      totalOrders: orders.length,
      pendingOrders: orders.filter(
        (o) => o.status === "DRAFT" || o.status === "CONFIRMED",
      ).length,
      completedOrders: orders.filter((o) => o.status === "COMPLETED").length,
      inProgressOrders: orders.filter((o) => o.status === "IN_PRODUCTION")
        .length,
      cancelledOrders: orders.filter((o) => o.status === "CANCELLED").length,
      recentActivities: auditLogs.slice(0, 10), // Get 10 most recent
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
  getOrdersByStatus,
  getOrdersByPriority,
  searchOrders,
  getUpcomingDeadlineOrders,
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
