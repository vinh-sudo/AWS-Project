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

  // ===================== STATISTICS =====================

  /**
   * Get production overview (TODAY/WEEK/MONTH)
   * GET /api/manager/statistics/production-overview
   * @param {string} range - 'TODAY' | 'WEEK' | 'MONTH'
   */
  getProductionOverview: async (range = "TODAY") => {
    const response = await api.get(
      "/api/manager/statistics/production-overview",
      {
        params: { range },
      },
    );
    return response.data;
  },

  /**
   * Get OEE trend over a date range
   * GET /api/manager/statistics/oee-trend
   */
  getOeeTrend: async (from, to) => {
    const response = await api.get("/api/manager/statistics/oee-trend", {
      params: { from, to },
    });
    return response.data;
  },

  /**
   * Compare production lines over a date range
   * GET /api/manager/statistics/line-comparison
   */
  getLineComparison: async (from, to) => {
    const response = await api.get("/api/manager/statistics/line-comparison", {
      params: { from, to },
    });
    return response.data;
  },

  /**
   * Get yield trend over a date range
   * GET /api/manager/statistics/yield-trend
   */
  getYieldTrend: async (from, to) => {
    const response = await api.get("/api/manager/statistics/yield-trend", {
      params: { from, to },
    });
    return response.data;
  },

  /**
   * Get schedule adherence stats over a date range
   * GET /api/manager/statistics/schedule-adherence
   */
  getScheduleAdherence: async (from, to) => {
    const response = await api.get(
      "/api/manager/statistics/schedule-adherence",
      {
        params: { from, to },
      },
    );
    return response.data;
  },

  /**
   * Get incident summary stats over a date range
   * GET /api/manager/statistics/incident-summary
   */
  getIncidentSummary: async (from, to) => {
    const response = await api.get("/api/manager/statistics/incident-summary", {
      params: { from, to },
    });
    return response.data;
  },
};

export default managerService;
