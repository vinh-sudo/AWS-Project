import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [
    {
      id: 1,
      username: "admin",
      email: "admin@ims.com",
      role: "Admin",
      status: "Active",
      fullName: "System Administrator",
      createdAt: "2025-01-01",
    },
    {
      id: 2,
      username: "leader.user",
      email: "leader@ims.com",
      role: "Leader",
      status: "Active",
      fullName: "Team Leader",
      createdAt: "2025-01-18",
    },
    {
      id: 3,
      username: "worker.user",
      email: "worker@ims.com",
      role: "Worker",
      status: "Active",
      fullName: "John Worker",
      createdAt: "2025-01-20",
    },
  ],
  employees: [
    { id: "EMP001", name: "John Smith", role: "Worker" },
    { id: "EMP002", name: "Jane Doe", role: "Worker" },
    { id: "EMP003", name: "Mike Johnson", role: "Worker" },
    { id: "EMP004", name: "Sarah Williams", role: "Worker" },
    { id: "EMP005", name: "David Brown", role: "Worker" },
  ],
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    // Add new user
    addUser: (state, action) => {
      const newUser = {
        id: state.users.length + 1,
        ...action.payload,
        createdAt: new Date().toISOString().split("T")[0],
      };
      state.users.push(newUser);
    },
    // Update user
    updateUser: (state, action) => {
      const index = state.users.findIndex((u) => u.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = { ...state.users[index], ...action.payload };
      }
    },
    // Delete user
    deleteUser: (state, action) => {
      state.users = state.users.filter((user) => user.id !== action.payload);
    },
    // Toggle user status
    toggleUserStatus: (state, action) => {
      const user = state.users.find((u) => u.id === action.payload);
      if (user) {
        user.status = user.status === "Active" ? "Blocked" : "Active";
      }
    },
    // Add employee
    addEmployee: (state, action) => {
      state.employees.push(action.payload);
    },
    // Update employee
    updateEmployee: (state, action) => {
      const index = state.employees.findIndex(
        (e) => e.id === action.payload.id
      );
      if (index !== -1) {
        state.employees[index] = {
          ...state.employees[index],
          ...action.payload,
        };
      }
    },
    // Delete employee
    deleteEmployee: (state, action) => {
      state.employees = state.employees.filter(
        (emp) => emp.id !== action.payload
      );
    },
  },
});

export const {
  addUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  addEmployee,
  updateEmployee,
  deleteEmployee,
} = userSlice.actions;

// Selectors
export const selectAllUsers = (state) => state.users.users;
export const selectAllEmployees = (state) => state.users.employees;
export const selectUsersByRole = (role) => (state) =>
  state.users.users.filter((user) => user.role === role);
export const selectActiveUsers = (state) =>
  state.users.users.filter((user) => user.status === "Active");
export const selectUsersLoading = (state) => state.users.isLoading;

export default userSlice.reducer;
