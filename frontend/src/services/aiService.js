import { api } from "./authService";

const aiService = {
  // POST /api/ai/chat - Send chat message to AI
  chat: async (message, sessionId) => {
    const response = await api.post("/api/ai/chat", {
      message,
      sessionId,
    });
    return response.data;
  },

  // GET /api/ai/quick-status - Get quick production status
  getQuickStatus: async () => {
    const response = await api.get("/api/ai/quick-status");
    return response.data;
  },

  // GET /api/production-analysis/production-health - Get production health summary
  getProductionHealth: async () => {
    const response = await api.get(
      "/api/production-analysis/production-health",
    );
    return response.data;
  },

  // GET /api/production-analysis/root-cause-analysis - Get root cause analysis
  getRootCauseAnalysis: async () => {
    const response = await api.get(
      "/api/production-analysis/root-cause-analysis",
    );
    return response.data;
  },
};

export default aiService;
