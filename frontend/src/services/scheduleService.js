import { api } from "./authService";

// Schedule service — calls /api/schedules endpoints
// Backend: ScheduleController — NO auth check (public endpoints)

const scheduleService = {
  /**
   * Pause a production schedule
   * POST /api/schedules/{id}/pause
   * @param {number} scheduleId
   */
  pauseSchedule: async (scheduleId) => {
    const response = await api.post(`/api/schedules/${scheduleId}/pause`);
    return response.data;
  },

  /**
   * Resume a paused production schedule
   * POST /api/schedules/{id}/resume
   * @param {number} scheduleId
   */
  resumeSchedule: async (scheduleId) => {
    const response = await api.post(`/api/schedules/${scheduleId}/resume`);
    return response.data;
  },
};

export default scheduleService;
