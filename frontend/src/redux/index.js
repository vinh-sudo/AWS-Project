// Redux Store
export { store } from "./store";

// Auth Slice
export {
  login,
  logout,
  clearError,
  resetAuth,
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectError,
} from "./slices/authSlice";

// Task Slice
export {
  addTask,
  updateTaskStatus,
  deleteTask,
  startTask,
  completeTask,
  updateTask,
  selectAllTasks,
  selectTasksByEmployee,
  selectTasksByStatus,
  selectTasksLoading,
} from "./slices/taskSlice";

// User Slice
export {
  addUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  selectAllUsers,
  selectAllEmployees,
  selectUsersByRole,
  selectActiveUsers,
  selectUsersLoading,
} from "./slices/userSlice";

// Schedule Slice
export {
  addSchedule,
  updateSchedule,
  deleteSchedule,
  addOrder,
  updateOrderStatus,
  deleteOrder,
  selectAllSchedules,
  selectAllProductionLines,
  selectAllOrders,
  selectSchedulesByLine,
  selectOrdersByStatus,
  selectSchedulesLoading,
} from "./slices/scheduleSlice";

// Order Slice
export {
  fetchOrders,
  createOrder,
  updateOrder,
  deleteOrder as removeOrder,
  setSelectedOrder,
  clearSelectedOrder,
  setFilters as setOrderFilters,
  clearFilters as clearOrderFilters,
  clearError as clearOrderError,
  selectOrders,
  selectSelectedOrder,
  selectOrdersLoading,
  selectOrdersError,
  selectOrderFilters,
  selectFilteredOrders,
} from "./slices/orderSlice";

// Line Slice
export {
  fetchLines,
  createLine,
  updateLine,
  updateLineStatus,
  deleteLine,
  addMachine,
  setSelectedLine,
  clearSelectedLine,
  setLineFilters,
  clearLineFilters,
  clearLineError,
  selectLines,
  selectSelectedLine,
  selectLinesLoading,
  selectLinesError,
  selectLineFilters,
  selectFilteredLines,
  selectLinesSummary,
} from "./slices/lineSlice";
