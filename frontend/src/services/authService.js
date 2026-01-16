import { mockUsers } from "./mockData";

// Simulate API delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Auth service for handling authentication
export const authService = {
  // Login function
  login: async (email, password) => {
    // Simulate API call delay
    await delay(500);

    const user = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (user.status !== "Active") {
      throw new Error("Your account has been blocked. Please contact admin.");
    }

    // Create user session (without password)
    const userSession = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    // Store in localStorage
    localStorage.setItem("user", JSON.stringify(userSession));
    localStorage.setItem("isAuthenticated", "true");

    return userSession;
  },

  // Logout function
  logout: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return localStorage.getItem("isAuthenticated") === "true";
  },

  // Check if user has specific role
  hasRole: (role) => {
    const user = authService.getCurrentUser();
    return user?.role === role;
  },

  // Check if user is admin
  isAdmin: () => {
    return authService.hasRole("Admin");
  },
};

export default authService;
