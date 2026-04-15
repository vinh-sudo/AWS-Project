import axios from "axios";
import { isTokenExpired } from "../utils/tokenUtils";

const normalizeBaseUrl = (url) =>
  typeof url === "string" ? url.replace(/\/$/, "") : "";

const normalizeEmployeeCode = (value) =>
  typeof value === "string" ? value.replace(/\s+/g, "").toUpperCase() : "";

const resolveApiBaseUrl = () => {
  const envUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL);

  // Default to same-origin if env is not configured.
  if (!envUrl) {
    return "";
  }

  try {
    const parsed = new URL(envUrl);

    if (typeof window !== "undefined") {
      // Avoid browser mixed-content blocks when frontend is HTTPS.
      if (
        window.location.protocol === "https:" &&
        parsed.protocol === "http:"
      ) {
        parsed.protocol = "https:";
      }
    }

    return normalizeBaseUrl(parsed.toString());
  } catch {
    // Keep original env URL if parsing fails.
  }

  return envUrl;
};

// If VITE_API_URL is missing, use same-origin relative URLs (""),
// which work when frontend and backend are served behind one domain/reverse proxy.
const API_BASE_URL = resolveApiBaseUrl();

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor to handle 401 (token expired / invalid)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // ONLY logout on 401 (Unauthorized = token expired/invalid)
    // DO NOT logout on 403 (Forbidden = user is logged in but lacks permission for that endpoint)
    // 403 only means the role lacks permission, NOT that the token is invalid
    if (
      status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/api/auth/")
    ) {
      originalRequest._retry = true;

      // Check if the refresh token is also expired
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken || isTokenExpired(refreshToken, 0)) {
        // Refresh token expired → force logout
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("isAuthenticated");

        // Only redirect if not already on login/auth pages
        const publicPaths = [
          "/login",
          "/forgot-password",
          "/otp-verification",
          "/reset-password",
        ];
        if (
          !publicPaths.some((path) => window.location.pathname.startsWith(path))
        ) {
          window.location.href = "/login";
        }
      } else {
        // Access token expired but refresh token is still valid
        // Since there is no /api/auth/refresh endpoint, clear session and redirect
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("isAuthenticated");

        const publicPaths = [
          "/login",
          "/forgot-password",
          "/otp-verification",
          "/reset-password",
        ];
        if (
          !publicPaths.some((path) => window.location.pathname.startsWith(path))
        ) {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

const OTP_ENDPOINTS = {
  request: ["/otp/forgot/request", "/api/otp/forgot/request"],
  verify: ["/otp/forgot/verify", "/api/otp/forgot/verify"],
  resend: ["/otp/resend", "/api/otp/resend"],
};

const postWithFallbackPaths = async (paths, payload) => {
  let lastError;

  for (const path of paths) {
    try {
      const response = await api.post(path, payload);
      const contentType =
        typeof response?.headers?.["content-type"] === "string"
          ? response.headers["content-type"].toLowerCase()
          : "";
      const bodyPreview =
        typeof response?.data === "string"
          ? response.data.trim().slice(0, 80).toLowerCase()
          : "";

      // Some CDN/frontend hosts return index.html with 200 for unknown routes.
      // Treat it as invalid API response instead of a success.
      const isHtmlFallback =
        contentType.includes("text/html") ||
        bodyPreview.startsWith("<!doctype html") ||
        bodyPreview.startsWith("<html");

      if (isHtmlFallback) {
        const htmlFallbackError = new Error(
          "Received HTML instead of API response",
        );
        htmlFallbackError.response = {
          status: 502,
          data: "API host is likely misconfigured and points to frontend domain.",
        };
        lastError = htmlFallbackError;
        continue;
      }

      return response;
    } catch (error) {
      const status = error?.response?.status;

      if (
        status === 401 ||
        status === 403 ||
        status === 404 ||
        status === 405
      ) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error("OTP endpoint is unavailable");
};

const extractOtpErrorMessage = (error, fallbackMessage) => {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const errorMessage =
    data?.message || data?.error || (typeof data === "string" ? data : "");

  if (!error?.response) {
    return "Cannot reach server. Please check API URL/network and try again.";
  }

  if (status === 502) {
    return "Frontend is calling a non-API host (received HTML). Please set VITE_API_URL to your backend API domain.";
  }

  if (status >= 500) {
    if (errorMessage === "An unexpected error occurred") {
      return "Backend returned INTERNAL_ERROR. Employee code may be invalid, or OTP mail service failed on server.";
    }

    if (errorMessage) {
      return errorMessage;
    }

    return "Backend OTP service failed internally. Please contact backend support.";
  }

  if (errorMessage) {
    return errorMessage;
  }

  if (status === 404 || status === 405) {
    return "OTP endpoint is not available on current backend route.";
  }

  return fallbackMessage;
};

// Auth service for handling authentication
export const authService = {
  // Login function - calls POST /api/auth/login
  login: async (employeeCode, password) => {
    try {
      const response = await api.post("/api/auth/login", {
        employeeCode,
        password,
      });

      const data = response.data;
      console.log("Login response data:", data); // Debug log

      // Store tokens
      if (data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        console.log("Token saved:", data.accessToken.substring(0, 50) + "..."); // Debug log
      } else {
        console.warn("No accessToken in response!"); // Debug log
      }
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }

      // Store user info
      const userSession = {
        id: data.id,
        userId: data.userId ?? data.id,
        employeeCode: data.employeeCode,
        username: data.username,
        fullName: data.fullName,
        role: data.role,
        email: data.email,
      };

      localStorage.setItem("user", JSON.stringify(userSession));
      localStorage.setItem("isAuthenticated", "true");

      return userSession;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data ||
        "Login failed. Please check your credentials.";
      throw new Error(
        typeof errorMessage === "string" ? errorMessage : "Login failed",
      );
    }
  },

  // Register function - calls POST /api/auth/register
  register: async (registerData) => {
    try {
      const response = await api.post("/api/auth/register", registerData);
      return response.data;
    } catch (error) {
      const data = error.response?.data;
      // Handle field-level validation errors from backend
      if (data?.fieldErrors && typeof data.fieldErrors === "object") {
        const details = Object.entries(data.fieldErrors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join("\n");
        throw new Error(details);
      }
      const errorMessage =
        data?.message || data?.error || "Registration failed";
      throw new Error(
        typeof errorMessage === "string" ? errorMessage : "Registration failed",
      );
    }
  },

  // Logout function - invalidate token server-side + clear client session
  logout: async () => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    await api
      .post("/api/auth/logout", { accessToken, refreshToken })
      .catch(() => {});
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
  },

  // Request password reset OTP - calls POST /otp/forgot/request
  requestPasswordReset: async (employeeCode) => {
    const normalizedEmployeeCode = normalizeEmployeeCode(employeeCode);

    if (!normalizedEmployeeCode) {
      throw new Error("Employee Code is required");
    }

    try {
      const response = await postWithFallbackPaths(OTP_ENDPOINTS.request, {
        employeeCode: normalizedEmployeeCode,
      });
      return response.data;
    } catch (error) {
      throw new Error(extractOtpErrorMessage(error, "Failed to send OTP"));
    }
  },

  // Verify OTP and reset password - calls POST /otp/forgot/verify
  verifyOtpAndResetPassword: async (employeeCode, otp, newPassword) => {
    const normalizedEmployeeCode = normalizeEmployeeCode(employeeCode);
    const normalizedOtp = typeof otp === "string" ? otp.trim() : "";

    if (!normalizedEmployeeCode) {
      throw new Error("Employee Code is required");
    }

    if (!normalizedOtp) {
      throw new Error("OTP is required");
    }

    try {
      const response = await postWithFallbackPaths(OTP_ENDPOINTS.verify, {
        employeeCode: normalizedEmployeeCode,
        otp: normalizedOtp,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw new Error(extractOtpErrorMessage(error, "OTP verification failed"));
    }
  },

  // Resend OTP - calls POST /otp/resend
  resendOtp: async (employeeCode) => {
    const normalizedEmployeeCode = normalizeEmployeeCode(employeeCode);

    if (!normalizedEmployeeCode) {
      throw new Error("Employee Code is required");
    }

    try {
      const response = await postWithFallbackPaths(OTP_ENDPOINTS.resend, {
        employeeCode: normalizedEmployeeCode,
      });
      return response.data;
    } catch (error) {
      throw new Error(extractOtpErrorMessage(error, "Failed to resend OTP"));
    }
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return (
      localStorage.getItem("isAuthenticated") === "true" &&
      localStorage.getItem("accessToken") !== null
    );
  },

  // Get access token
  getAccessToken: () => {
    return localStorage.getItem("accessToken");
  },

  // Check if user has specific role
  hasRole: (role) => {
    const user = authService.getCurrentUser();
    return user?.role === role;
  },

  // Check if user is admin
  isAdmin: () => {
    return authService.hasRole("ADMIN");
  },

  // Check if user is manager
  isManager: () => {
    return authService.hasRole("MANAGER");
  },

  // Check if user is line leader
  isLineLeader: () => {
    return authService.hasRole("LINE_LEADER");
  },

  // Check if user is production planner
  isProductionPlanner: () => {
    const user = authService.getCurrentUser();
    const role = user?.role?.toUpperCase();
    return role === "PRODUCTION_PLANNER" || role === "MANAGER";
  },
};

// Export the shared axios instance so other services can use the same
// interceptors (auto token injection, 401/403 handling)
export { api };

export default authService;
