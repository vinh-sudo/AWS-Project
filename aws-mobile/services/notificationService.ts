import { api } from "@/services/authService";

export type NotificationSourceType =
  | "ORDER"
  | "SCHEDULE"
  | "LINE"
  | "ACCOUNT"
  | "KPI"
  | "QUALITY"
  | "REPORT"
  | "MACHINE";

export type NotificationLevel = "INFO" | "WARN" | "ERROR";

export type NotificationStatus = "UNREAD" | "READ";

export type NotificationItem = {
  id: number | string;
  title?: string;
  message?: string;
  sourceType?: NotificationSourceType | string;
  level?: NotificationLevel;
  status?: NotificationStatus;
  createdAt?: string;
  url?: string;
};

export type NotificationPage = {
  content: NotificationItem[];
  number: number;
  totalPages: number;
  totalElements: number;
};

const toPage = (data: any, pageNum: number): NotificationPage => {
  if (Array.isArray(data)) {
    return {
      content: data,
      number: pageNum,
      totalPages: 1,
      totalElements: data.length,
    };
  }

  return {
    content: Array.isArray(data?.content) ? data.content : [],
    number: Number(data?.number ?? pageNum),
    totalPages: Number(data?.totalPages ?? 1),
    totalElements: Number(data?.totalElements ?? 0),
  };
};

const getWithFallback = async (paths: string[]) => {
  let lastError: unknown = null;

  for (const path of paths) {
    try {
      const response = await api.get(path);
      return response.data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};

const putWithFallback = async (paths: string[], body?: unknown) => {
  let lastError: unknown = null;

  for (const path of paths) {
    try {
      const response = await api.put(path, body);
      return response.data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};

const notificationService = {
  getUnreadCount: async (userId: number) => {
    const data = await getWithFallback([
      `/api/notifications/unread-count?userId=${userId}`,
      `/api/notifications/unread/count?userId=${userId}`,
      `/api/notifications/users/${userId}/unread-count`,
      `/api/notification/unread-count?userId=${userId}`,
    ]);

    if (typeof data === "number") {
      return data;
    }

    return Number(data?.count ?? data?.unreadCount ?? 0);
  },

  getNotifications: async (userId: number, page = 0, size = 20): Promise<NotificationPage> => {
    const data = await getWithFallback([
      `/api/notifications?userId=${userId}&page=${page}&size=${size}`,
      `/api/notifications/users/${userId}?page=${page}&size=${size}`,
      `/api/notification?userId=${userId}&page=${page}&size=${size}`,
    ]);

    return toPage(data, page);
  },

  getFilteredNotifications: async (
    userId: number,
    sourceType: NotificationSourceType,
    page = 0,
    size = 20,
  ): Promise<NotificationPage> => {
    const normalized = String(sourceType).toUpperCase();

    const data = await getWithFallback([
      `/api/notifications/filter?userId=${userId}&sourceType=${normalized}&page=${page}&size=${size}`,
      `/api/notifications?userId=${userId}&sourceType=${normalized}&page=${page}&size=${size}`,
      `/api/notifications/users/${userId}?sourceType=${normalized}&page=${page}&size=${size}`,
      `/api/notification/filter?userId=${userId}&sourceType=${normalized}&page=${page}&size=${size}`,
    ]);

    return toPage(data, page);
  },

  markAsRead: async (notificationId: number | string, userId: number) => {
    await putWithFallback([
      `/api/notifications/${notificationId}/read?userId=${userId}`,
      `/api/notifications/read/${notificationId}?userId=${userId}`,
      `/api/notifications/${notificationId}/mark-read?userId=${userId}`,
      `/api/notification/${notificationId}/read?userId=${userId}`,
    ], {});
  },

  markAllAsRead: async (userId: number) => {
    await putWithFallback([
      `/api/notifications/read-all?userId=${userId}`,
      `/api/notifications/mark-all-read?userId=${userId}`,
      `/api/notifications/users/${userId}/read-all`,
      `/api/notification/read-all?userId=${userId}`,
    ], {});
  },
};

export default notificationService;
