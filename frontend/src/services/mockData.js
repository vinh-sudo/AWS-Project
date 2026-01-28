// Mock data for users with different roles
// NOTE: This is mock data for development/testing only.
// Passwords are loaded from environment variables for security.

// Password mapping by role - loaded from .env file
const getPasswordForRole = (role) => {
  const passwords = {
    Admin: import.meta.env.VITE_MOCK_ADMIN_PASSWORD || '',
    Manager: import.meta.env.VITE_MOCK_MANAGER_PASSWORD || '',
    Planner: import.meta.env.VITE_MOCK_PLANNER_PASSWORD || '',
    Leader: import.meta.env.VITE_MOCK_LEADER_PASSWORD || '',
  };
  return passwords[role] || '';
};

export const mockUsers = [
  {
    id: 1,
    username: "admin",
    email: "admin@ims.com",
    role: "Admin",
    status: "Active",
    fullName: "System Administrator",
    createdAt: "2025-01-01",
    get password() { return getPasswordForRole(this.role); }
  },
  {
    id: 2,
    username: "manager.user",
    email: "manager@ims.com",
    role: "Manager",
    status: "Active",
    fullName: "Manager User",
    createdAt: "2025-01-05",
    get password() { return getPasswordForRole(this.role); }
  },
  {
    id: 3,
    username: "planner.user",
    email: "planner@ims.com",
    role: "Planner",
    status: "Active",
    fullName: "Lisa Johnson",
    createdAt: "2025-01-10",
    get password() { return getPasswordForRole(this.role); }
  },
  {
    id: 4,
    username: "leader.user",
    email: "leader@ims.com",
    role: "Leader",
    status: "Active",
    fullName: "John Leader",
    createdAt: "2025-01-15",
    get password() { return getPasswordForRole(this.role); }
  },
];

// Role permissions
export const rolePermissions = {
  Admin: ["dashboard", "users", "settings", "reports", "approval", "audit-log"],
  Manager: ["dashboard", "tasks", "orders", "scheduling", "reports"],
  Planner: ["dashboard", "assignment", "scheduling", "reports"],
  Leader: ["dashboard", "progress", "team"],
};
