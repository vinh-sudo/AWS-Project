import { api } from "@/services/authService";

export type LeaderDashboardResponse = {
  lineId?: number | string;
  lineName?: string;
  todayProducedQuantity?: number;
  todayDowntimeMinutes?: number;
  todayEfficiency?: number;
  activeScheduleCount?: number;
  unresolvedIncidentCount?: number;
  recentIncidents?: {
    incidentId?: number | string;
    incidentType?: string;
    severity?: "LOW" | "MEDIUM" | "HIGH";
    timestamp?: string;
    description?: string;
    scheduleId?: number | string;
  }[];
};

export type ScheduleSummaryResponse = {
  scheduleId: number | string;
  orderInfo?: string;
  status: "SCHEDULED" | "RUNNING" | "PAUSED" | "COMPLETED";
  startTime?: string;
  endTime?: string;
  percentage?: number;
  orderCompletionPercentage?: number;
  orderItemCompletionPercentage?: number;
  previousStageGoodQuantity?: number;
  previousGoodQuantity?: number;
  prevStageGoodQty?: number;
  targetQuantity?: number;
  targetQty?: number;
  plannedQty?: number;
  plannedQuantity?: number;
  planQty?: number;
  quantity?: number;
  orderQuantity?: number;
  requiredQuantity?: number;
  totalQuantity?: number;
  orderItemQuantity?: number;
  orderItem?: {
    plannedQty?: number;
    quantity?: number;
    targetQuantity?: number;
  };
  goodQuantity?: number;
  rejectQuantity?: number;
  downtimeMinutes?: number;
  documents?: (string | { id?: number | string; fileName?: string; documentName?: string; url?: string; fileUrl?: string; downloadUrl?: string })[];
};

export type SubmitReportPayload = {
  scheduleId: number | string;
  shift: "MORNING" | "AFTERNOON" | "NIGHT";
  targetQuantity: number;
  goodQuantity: number;
  rejectQuantity: number;
  downtimeMinutes?: number;
  notes?: string;
};

export type ReportIncidentPayload = {
  scheduleId: number | string;
  machineId?: number | string | null;
  incidentType: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  description: string;
};

const leaderService = {
  getDashboard: async (): Promise<LeaderDashboardResponse> => {
    const response = await api.get("/api/leader/dashboard");
    return response.data;
  },

  getMySchedules: async (): Promise<ScheduleSummaryResponse[]> => {
    const response = await api.get("/api/leader/schedules");
    return response.data;
  },

  submitReport: async (data: SubmitReportPayload) => {
    const response = await api.post("/api/leader/report", data);
    return response.data;
  },

  reportIncident: async (data: ReportIncidentPayload) => {
    await api.post("/api/leader/incident", data);
  },

  startSchedule: async (scheduleId: number | string) => {
    const response = await api.post(`/api/leader/schedules/${scheduleId}/start`);
    return response.data;
  },

  resumeSchedule: async (scheduleId: number | string) => {
    const response = await api.post(`/api/leader/schedules/${scheduleId}/resume`);
    return response.data;
  },
};

export default leaderService;
