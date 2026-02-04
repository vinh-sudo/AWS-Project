import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8082/api";

// Get token from localStorage - must match authService key "accessToken"
const getAuthHeader = () => {
  const token = localStorage.getItem("accessToken");
  console.log(
    "Token being sent:",
    token ? token.substring(0, 50) + "..." : "NO TOKEN",
  ); // Debug
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const managerService = {
  // ===================== LINES OVERVIEW =====================
  getLinesOverview: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/manager/lines/overview`,
        {
          headers: getAuthHeader(),
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching lines overview:", error);
      throw error;
    }
  },

  // ===================== PLANNING =====================
  createPlan: async (planRequest) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/manager/plans/create`,
        planRequest,
        {
          headers: getAuthHeader(),
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error creating plan:", error);
      throw error;
    }
  },

  confirmPlan: async (orderId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/manager/plans/order/${orderId}/confirm`,
        {},
        {
          headers: getAuthHeader(),
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error confirming plan:", error);
      throw error;
    }
  },

  cancelPlan: async (orderId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/manager/plans/order/${orderId}/cancel`,
        {},
        {
          headers: getAuthHeader(),
        },
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
      const response = await axios.get(`${API_BASE_URL}/manager/plans/view`, {
        headers: getAuthHeader(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching plans:", error);
      throw error;
    }
  },

  // ===================== TRACKING =====================
  getOEE: async (date) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/manager/tracking/oee`, {
        headers: getAuthHeader(),
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
      const response = await axios.get(
        `${API_BASE_URL}/manager/tracking/gantt`,
        {
          headers: getAuthHeader(),
          params: { date },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching Gantt data:", error);
      throw error;
    }
  },

  getDelays: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/manager/tracking/delays`,
        {
          headers: getAuthHeader(),
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching delays:", error);
      throw error;
    }
  },

  // ===================== ORDERS (for planning) =====================
  getOrders: async (status = null) => {
    try {
      const params = status ? { status } : {};
      const response = await axios.get(`${API_BASE_URL}/manager/orders`, {
        headers: getAuthHeader(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  },
};

export default managerService;
