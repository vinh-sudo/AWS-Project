import { api } from "./authService";

// Uses the shared axios instance from authService which:
// - Automatically injects Authorization header from localStorage
// - Handles 401/403 responses (clears session & redirects to login)

const managerService = {
  // ===================== LINES OVERVIEW =====================
  getLinesOverview: async () => {
    try {
      const response = await api.get("/api/manager/lines/overview");
      return response.data;
    } catch (error) {
      console.error("Error fetching lines overview:", error);
      throw error;
    }
  },

  // ===================== PLANNING =====================
  createPlan: async (planRequest) => {
    try {
      const response = await api.post("/api/manager/plans/create", planRequest);
      return response.data;
    } catch (error) {
      console.error("Error creating plan:", error);
      throw error;
    }
  },

  confirmPlan: async (orderId) => {
    try {
      const response = await api.post(
        `/api/manager/plans/order/${orderId}/confirm`,
        {},
      );
      return response.data;
    } catch (error) {
      console.error("Error confirming plan:", error);
      throw error;
    }
  },

  cancelPlan: async (orderId) => {
    try {
      const response = await api.post(
        `/api/manager/plans/order/${orderId}/cancel`,
        {},
      );
      return response.data;
    } catch (error) {
      console.error("Error cancelling plan:", error);
      throw error;
    }
  },

  getAllPlans: async (status = null) => {
    try {
      const params = status ? { status } : {};
      const response = await api.get("/api/manager/plans/view", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching plans:", error);
      throw error;
    }
  },

  // ===================== TRACKING =====================
  getOEE: async (date) => {
    try {
      const response = await api.get("/api/manager/tracking/oee", {
        params: { date },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching OEE:", error);
      throw error;
    }
  },

  getGantt: async (date) => {
    try {
      const response = await api.get("/api/manager/tracking/gantt", {
        params: { date },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching Gantt data:", error);
      throw error;
    }
  },

  getDelays: async () => {
    try {
      const response = await api.get("/api/manager/tracking/delays");
      return response.data;
    } catch (error) {
      console.error("Error fetching delays:", error);
      throw error;
    }
  },

  // ===================== ORDERS (for planning) =====================
  // NOTE: Backend chưa có endpoint /api/manager/orders cho role MANAGER.
  // Orders chỉ có ở /api/admin/orders (yêu cầu ADMIN role).
  // Khi backend tạo endpoint này, uncomment và sửa lại.
  getOrders: async (/* status = null */) => {
    // Trả về mảng rỗng vì backend chưa có endpoint cho manager xem orders
    return [];
  },
};

export default managerService;
