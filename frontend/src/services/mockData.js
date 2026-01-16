// Mock data for users with different roles
export const mockUsers = [
  {
    id: 1,
    username: "admin",
    email: "admin@ims.com",
    password: "admin123",
    role: "Admin",
    status: "Active",
    fullName: "System Administrator",
    createdAt: "2025-01-01",
  },
  {
    id: 2,
    username: "sales.user",
    email: "sales@ims.com",
    password: "sales123",
    role: "Sales",
    status: "Active",
    fullName: "Sales User",
    createdAt: "2025-01-05",
  },
  {
    id: 3,
    username: "planner.user",
    email: "planner@ims.com",
    password: "planner123",
    role: "Planner",
    status: "Active",
    fullName: "Planner User",
    createdAt: "2025-01-10",
  },
  {
    id: 4,
    username: "manager.user",
    email: "manager@ims.com",
    password: "manager123",
    role: "Manager",
    status: "Active",
    fullName: "Manager User",
    createdAt: "2025-01-15",
  },
];

// Role permissions
export const rolePermissions = {
  Admin: ["dashboard", "users", "settings", "reports", "inventory", "orders"],
  Manager: ["dashboard", "reports", "inventory", "orders"],
  Sales: ["dashboard", "orders", "inventory"],
  Planner: ["dashboard", "inventory", "reports"],
};
