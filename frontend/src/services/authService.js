import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

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

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          // TODO: Implement refresh token endpoint when available
          // const response = await api.post('/api/auth/refresh', { refreshToken });
          // localStorage.setItem('accessToken', response.data.accessToken);
          // return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          authService.logout();
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

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
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Registration failed";
      throw new Error(
        typeof errorMessage === "string" ? errorMessage : "Registration failed",
      );
    }
  },

  // Logout function - calls POST /api/auth/logout
  logout: async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (accessToken) {
        await api.post("/api/auth/logout", {
          accessToken,
          refreshToken,
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear local storage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("isAuthenticated");
    }
  },

  // Request password reset OTP - calls POST /otp/forgot/request
  requestPasswordReset: async (employeeCode) => {
    try {
      const response = await api.post("/otp/forgot/request", {
        employeeCode,
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to send OTP";
      throw new Error(
        typeof errorMessage === "string" ? errorMessage : "Failed to send OTP",
      );
    }
  },

  // Verify OTP and reset password - calls POST /otp/forgot/verify
  verifyOtpAndResetPassword: async (employeeCode, otp, newPassword) => {
    try {
      const response = await api.post("/otp/forgot/verify", {
        employeeCode,
        otp,
        newPassword,
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        "Invalid or expired OTP";
      throw new Error(
        typeof errorMessage === "string"
          ? errorMessage
          : "OTP verification failed",
      );
    }
  },

  // Resend OTP - calls POST /otp/resend
  resendOtp: async (employeeCode) => {
    try {
      const response = await api.post("/otp/resend", {
        employeeCode,
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to resend OTP";
      throw new Error(
        typeof errorMessage === "string"
          ? errorMessage
          : "Failed to resend OTP",
      );
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

  // Check if user is director
  isDirector: () => {
    return authService.hasRole("DIRECTOR");
  },
};

export default authService;
