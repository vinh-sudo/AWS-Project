import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";
const AUTH_FLAG_KEY = "isAuthenticated";

const DEFAULT_API_BASE_URL = "https://api.ims.mom";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_BASE_URL;

export const RESOLVED_API_BASE_URL = API_BASE_URL;

type SessionClearReason = "logout" | "expired" | "unauthorized";
type SessionClearedListener = (reason: SessionClearReason) => void;

const sessionClearedListeners = new Set<SessionClearedListener>();

export const subscribeSessionCleared = (listener: SessionClearedListener) => {
  sessionClearedListeners.add(listener);

  return () => {
    sessionClearedListeners.delete(listener);
  };
};

const normalizeToken = (token?: unknown): string | null => {
  if (typeof token !== "string") return null;

  const trimmed = token.trim();

  if (!trimmed) return null;

  return trimmed.replace(/^Bearer\s+/i, "");
};

const decodeBase64Url = (input: string): string => {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

  return atob(padded);
};

const isTokenExpired = (token?: string | null): boolean => {
  if (!token) return true;

  const normalized = normalizeToken(token);

  if (!normalized) return true;

  const parts = normalized.split(".");

  if (parts.length < 2) return false;

  try {
    const payloadText = decodeBase64Url(parts[1]);
    const payload = JSON.parse(payloadText) as { exp?: number };

    if (!payload?.exp) return false;

    return payload.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
};

const safeGetItem = async (key: string) => {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
};

const notifySessionCleared = (reason: SessionClearReason) => {
  sessionClearedListeners.forEach((listener) => {
    try {
      listener(reason);
    } catch {}
  });
};

const safeSetItem = async (key: string, value: string) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {}
};

const safeRemoveItem = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* REQUEST INTERCEPTOR */

api.interceptors.request.use(async (config) => {
  const token = normalizeToken(
    await safeGetItem(ACCESS_TOKEN_KEY)
  );

  if (isTokenExpired(token)) {
    await clearSession("expired");
    return Promise.reject(new Error("Session expired"));
  }

  if (token) {
    config.headers = config.headers ?? {};

    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log("API REQUEST:", {
    url: config.url,
    baseURL: config.baseURL,
    data: config.data,
  });

  return config;
});

/* RESPONSE INTERCEPTOR */

api.interceptors.response.use(
  (response) => {
    console.log("API RESPONSE:", response.data);

    return response;
  },

  async (error) => {
    console.log("API ERROR FULL:", error);

    console.log("API ERROR RESPONSE:", error?.response);

    console.log("API ERROR DATA:", error?.response?.data);

    const status = error?.response?.status;

    if (status === 401) {
      // Token is no longer valid; force re-login to avoid repeated unauthorized calls.
      await clearSession("unauthorized");
    }

    return Promise.reject(error);
  }
);

export type UserSession = {
  id?: number | string;
  userId?: number | string;
  employeeCode: string;
  username?: string;
  fullName: string;
  role: string;
  email?: string;
};

const clearSession = async (reason: SessionClearReason = "logout") => {
  await Promise.all([
    safeRemoveItem(ACCESS_TOKEN_KEY),
    safeRemoveItem(REFRESH_TOKEN_KEY),
    safeRemoveItem(USER_KEY),
    safeRemoveItem(AUTH_FLAG_KEY),
  ]);

  notifySessionCleared(reason);
};

export const authService = {

  login: async (
    employeeCode: string,
    password: string
  ): Promise<UserSession> => {

    try {

      const response = await api.post(
        "/api/auth/login",
        {
          employeeCode,
          password,
        }
      );

      const data = response.data || {};

      const accessToken =
        normalizeToken(data.accessToken) ||
        normalizeToken(data.token);

      const refreshToken =
        normalizeToken(data.refreshToken);

      if (accessToken) {

        await safeSetItem(
          ACCESS_TOKEN_KEY,
          accessToken
        );

      }

      if (refreshToken) {

        await safeSetItem(
          REFRESH_TOKEN_KEY,
          refreshToken
        );

      }

      const userSession: UserSession = {

        id: data.id,

        userId:
          data.userId ??
          data.id,

        employeeCode:
          String(
            data.employeeCode ??
            employeeCode
          ),

        username:
          data.username,

        fullName:
          String(
            data.fullName ??
            "User"
          ),

        role:
          String(
            data.role ??
            "EMPLOYEE"
          ).toUpperCase(),

        email:
          data.email,

      };

      await safeSetItem(
        USER_KEY,
        JSON.stringify(userSession)
      );

      await safeSetItem(
        AUTH_FLAG_KEY,
        "true"
      );

      return userSession;

    } catch (error: any) {

      if (error?.code === "ERR_NETWORK") {

        throw new Error(
          "Cannot connect to server: " +
          RESOLVED_API_BASE_URL
        );

      }

      if (error?.response) {

        const data =
          error.response.data;

        if (typeof data === "string") {

          throw new Error(data);

        }

        if (data?.message) {

          throw new Error(
            data.message
          );

        }

        if (data?.error) {

          throw new Error(
            data.error
          );

        }

        throw new Error(
          JSON.stringify(data)
        );

      }

      throw new Error(
        error?.message ||
        "Login failed"
      );

    }

  },

  logout: async () => {

    const accessToken =
      await safeGetItem(
        ACCESS_TOKEN_KEY
      );

    const refreshToken =
      await safeGetItem(
        REFRESH_TOKEN_KEY
      );

    try {

      await api.post(
        "/api/auth/logout",
        {
          accessToken,
          refreshToken,
        }
      );

    } catch {}

    await clearSession("logout");

  },

  clearSession,

  getCurrentUser:
    async (): Promise<UserSession | null> => {

      const user =
        await safeGetItem(USER_KEY);

      if (!user) return null;

      try {

        return JSON.parse(user);

      } catch {

        return null;

      }

    },

  isAuthenticated:
    async (): Promise<boolean> => {

      const token =
        await safeGetItem(
          ACCESS_TOKEN_KEY
        );

      if (!token) {
        return false;
      }

      if (isTokenExpired(token)) {
        await clearSession("expired");
        return false;
      }

      return true;

    },

  getAccessToken:
    async (): Promise<string | null> => {

      return safeGetItem(
        ACCESS_TOKEN_KEY
      );

    },

};

export default authService;