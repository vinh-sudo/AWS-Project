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
    username: "manager.user",
    email: "manager@ims.com",
    password: "manager123",
    role: "Manager",
    status: "Active",
    fullName: "Manager User",
    createdAt: "2025-01-05",
  },
  {
    id: 3,
    username: "planner.user",
    email: "planner@ims.com",
    password: "planner123",
    role: "Planner",
    status: "Active",
    fullName: "Lisa Johnson",
    createdAt: "2025-01-10",
  },
  {
    id: 4,
    username: "leader.user",
    email: "leader@ims.com",
    password: "leader123",
    role: "Leader",
    status: "Active",
    fullName: "John Leader",
    createdAt: "2025-01-15",
  },
];

// Role permissions
export const rolePermissions = {
  Admin: ["dashboard", "users", "settings", "reports", "approval", "audit-log"],
  Manager: ["dashboard", "tasks", "orders", "scheduling", "reports"],
  Planner: ["dashboard", "assignment", "scheduling", "reports"],
  Leader: ["dashboard", "progress", "team"],
};
