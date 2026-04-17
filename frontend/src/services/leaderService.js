import { api } from "./authService";

// Leader service — calls /api/leader endpoints
// Backend: LeaderController — requires LINE_LEADER role

const leaderService = {
  /**
   * Get leader dashboard overview (line status, KPIs, active schedules, incidents)
   * GET /api/leader/dashboard
   * @returns {Promise<LeaderDashboardResponse>}
   *   { lineId, lineName, todayProducedQuantity, todayDowntimeMinutes,
   *     todayEfficiency, activeScheduleCount, activeSchedules[],
   *     unresolvedIncidentCount, recentIncidents[] }
   */
  getDashboard: async () => {
    try {
      const response = await api.get("/api/leader/dashboard");
      return response.data;
    } catch (error) {
      console.error("Error fetching leader dashboard:", error);
      throw error;
    }
  },

  /**
   * Get active schedules on the leader's line
   * GET /api/leader/schedules
   * @returns {Promise<ScheduleSummaryResponse[]>}
   *   [{ scheduleId, orderInfo, status, startTime, endTime }]
   */
  getMySchedules: async () => {
    try {
      const response = await api.get("/api/leader/schedules");
      return response.data;
    } catch (error) {
      console.error("Error fetching leader schedules:", error);
      throw error;
    }
  },

  /**
   * Update production progress for a schedule
   * PUT /api/leader/progress
   * @param {Object} data - { scheduleId: number, percentage: number, note?: string }
   * @returns {Promise<ProgressResponse>}
   *   { scheduleId, percentage, scheduleStatus, message }
   */
  updateProgress: async (data) => {
    try {
      const response = await api.put("/api/leader/progress", data);
      return response.data;
    } catch (error) {
      console.error("Error updating progress:", error);
      throw error;
    }
  },

  /**
   * Submit end-of-shift report
   * POST /api/leader/report
   * @param {Object} data - { shift: "MORNING"|"AFTERNOON"|"NIGHT",
   *   targetQuantity, goodQuantity, rejectQuantity, downtimeMinutes?, notes? }
   * @returns {Promise<ReportResponse>}
   *   { reportId, lineId, lineName, workDate, shift, goodQuantity,
   *     rejectQuantity, targetQuantity, message }
   */
  submitReport: async (data) => {
    try {
      const response = await api.post("/api/leader/report", data);
      return response.data;
    } catch (error) {
      console.error("Error submitting shift report:", error);
      throw error;
    }
  },

  /**
   * Report a production incident
   * POST /api/leader/incident
   * @param {Object} data - { scheduleId, machineId?, incidentType,
   *   severity: "LOW"|"MEDIUM"|"HIGH", description }
   * @returns {Promise<void>}
   */
  reportIncident: async (data) => {
    try {
      await api.post("/api/leader/incident", data);
    } catch (error) {
      console.error("Error reporting incident:", error);
      throw error;
    }
  },
};

export default leaderService;
