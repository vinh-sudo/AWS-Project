import { api } from "./authService";

// Notification service — calls /api/notifications endpoints
// All endpoints require userId as a query param

const notificationService = {
  /**
   * Get paginated notifications for a user
   * @param {number} userId
   * @param {number} page - 0-indexed (default 0)
   * @param {number} size - page size (default 20)
   * @returns {Promise<{content: Array, totalElements: number, totalPages: number, number: number}>}
   */
  getNotifications: async (userId, page = 0, size = 20) => {
    const response = await api.get("/api/notifications", {
      params: { userId, page, size },
    });
    return response.data;
  },

  /**
   * Get unread notification count for a user
   * @param {number} userId
   * @returns {Promise<number>}
   */
  getUnreadCount: async (userId) => {
    const response = await api.get("/api/notifications/unread-count", {
      params: { userId },
    });
    return response.data;
  },

  /**
   * Mark a single notification as read
   * @param {number} notificationId
   * @param {number} userId
   */
  markAsRead: async (notificationId, userId) => {
    await api.post(`/api/notifications/${notificationId}/read`, null, {
      params: { userId },
    });
  },

  /**
   * Mark all notifications as read for a user
   * @param {number} userId
   */
  markAllAsRead: async (userId) => {
    await api.post("/api/notifications/read-all", null, {
      params: { userId },
    });
  },

  /**
   * Get filtered notifications by sourceType
   * @param {number} userId
   * @param {string} sourceType - ACCOUNT | LINE | SCHEDULE | REPORT | KPI | ORDER
   * @param {number} page
   * @param {number} size
   */
  getFilteredNotifications: async (userId, sourceType, page = 0, size = 20) => {
    const response = await api.get("/api/notifications/filter", {
      params: { userId, sourceType, page, size },
    });
    return response.data;
  },
};

export default notificationService;
